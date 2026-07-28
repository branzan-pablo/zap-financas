import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { faturaAtual, type FaturaTransacao } from "./fatura";
import { calcularLimiteSeguro, diasRestantesNoMes, type LimiteSeguro } from "./safe-limit";
import {
  detectarAssinaturas,
  detectarDuplicatas,
  type Assinatura,
  type Duplicata,
} from "./recurring";
import {
  orcamentosVigentes,
  statusOrcamentos,
  type OrcamentoStatus,
} from "./budgets";
import type { FaturaResumo } from "./alerts";

/**
 * Resumo financeiro consolidado de um usuário — fonte ÚNICA da agregação usada
 * pelo dashboard E pelo job de alertas outbound (evita lógica duplicada).
 *
 * Recebe o client Supabase + userId; funciona com o client RLS do próprio
 * usuário (dashboard) ou com o admin client (job/cron), pois filtra por user_id.
 * Toda a matemática vem das libs puras (fatura, safe-limit, recurring).
 */

export type CategoriaGasto = {
  id: string | null;
  nome: string;
  cor: string | null;
  icone: string | null;
  total: number;
};

export type ResumoFinanceiro = {
  numContas: number;
  saldoContas: number;
  totalInvestido: number;
  faturas: FaturaResumo[];
  faturaTotal: number;
  rendaMes: number;
  gastoMes: number;
  gastosPorCategoria: CategoriaGasto[];
  assinaturas: Assinatura[];
  custoAssinaturas: number;
  duplicatas: Duplicata[];
  limite: LimiteSeguro;
  orcamentos: OrcamentoStatus[];
};

type Categoria = { id: string; nome: string; cor: string | null; icone: string | null };
type Tx = {
  valor: number;
  data: string;
  descricao: string;
  account_id: string;
  categories: Categoria | null;
};

export async function resumoFinanceiro(
  db: SupabaseClient<Database>,
  userId: string,
  hoje: Date = new Date()
): Promise<ResumoFinanceiro> {
  // Janela de ~5 meses: suficiente p/ fatura do ciclo atual, gastos do mês e
  // detecção de recorrências (meses distintos), e bem menor/previsível que um
  // limit fixo. Usa o índice (user_id, data desc). O teto de 1500 é só rede de
  // segurança para contas hiperativas.
  const desde = new Date(hoje);
  desde.setDate(desde.getDate() - 150);
  const desdeStr = `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, "0")}-${String(desde.getDate()).padStart(2, "0")}`;

  const [
    { data: accData },
    { data: cardData },
    { data: invData },
    { data: txData },
    { data: budData },
  ] = await Promise.all([
    db.from("accounts").select("tipo, saldo").eq("user_id", userId).eq("ativo", true),
    db
      .from("cards")
      .select("nome, account_id, dia_fechamento, dia_vencimento")
      .eq("user_id", userId)
      .eq("ativo", true),
    db.from("investments").select("valor_atual").eq("user_id", userId),
    db
      .from("transactions")
      .select("valor, data, descricao, account_id, categories(id, nome, cor, icone)")
      .eq("user_id", userId)
      .gte("data", desdeStr)
      .order("data", { ascending: false })
      .limit(1500),
    db
      .from("budgets")
      .select("category_id, limite, mes_referencia")
      .eq("user_id", userId),
  ]);

  const contas = accData ?? [];
  const cartoes = cardData ?? [];
  const investimentos = invData ?? [];
  const txs = (txData ?? []) as unknown as Tx[];

  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const saldoContas = contas
    .filter((c) => c.tipo === "corrente" || c.tipo === "poupanca")
    .reduce((s, c) => s + (c.saldo ?? 0), 0);
  const totalInvestido = investimentos.reduce((s, i) => s + (i.valor_atual ?? 0), 0);

  // Fatura aberta por cartão.
  const txPorConta = new Map<string, FaturaTransacao[]>();
  for (const t of txs) {
    const arr = txPorConta.get(t.account_id) ?? [];
    arr.push({ valor: t.valor, data: t.data });
    txPorConta.set(t.account_id, arr);
  }
  const faturas: FaturaResumo[] = [];
  for (const c of cartoes) {
    if (!c.account_id || !c.dia_fechamento || !c.dia_vencimento) continue;
    const f = faturaAtual(txPorConta.get(c.account_id) ?? [], c.dia_fechamento, c.dia_vencimento, hoje);
    faturas.push({ nome: c.nome, fechamento: f.fechamento, total: f.total });
  }
  const faturaTotal = faturas.reduce((s, f) => s + f.total, 0);

  // Mês corrente.
  const txMes = txs.filter((t) => t.data.slice(0, 7) === mesAtual);
  const rendaMes = txMes.filter((t) => t.valor > 0).reduce((s, t) => s + t.valor, 0);
  const gastoMes = txMes.filter((t) => t.valor < 0).reduce((s, t) => s - t.valor, 0);

  const porCategoria = new Map<string, CategoriaGasto>();
  for (const t of txMes) {
    if (t.valor >= 0) continue;
    const cat =
      t.categories ?? { id: null, nome: "Sem categoria", cor: "#94a3b8", icone: "📌" };
    const chave = cat.id ?? cat.nome;
    const cur = porCategoria.get(chave) ?? { ...cat, total: 0 };
    cur.total += -t.valor;
    porCategoria.set(chave, cur);
  }
  const gastosPorCategoria = [...porCategoria.values()].sort((a, b) => b.total - a.total);

  // Orçamentos por categoria: linhas vigentes × gasto do mês corrente.
  const vigentes = orcamentosVigentes(budData ?? [], mesAtual);
  const orcamentos = statusOrcamentos(
    vigentes,
    gastosPorCategoria
      .filter((c): c is CategoriaGasto & { id: string } => c.id != null)
      .map((c) => ({ categoriaId: c.id, nome: c.nome, total: c.total }))
  );

  // Insights.
  const insightTxs = txs.map((t) => ({ descricao: t.descricao, valor: t.valor, data: t.data }));
  const assinaturas = detectarAssinaturas(insightTxs);
  const custoAssinaturas = assinaturas.reduce((s, a) => s + a.valorMedio, 0);
  const duplicatas = detectarDuplicatas(insightTxs);

  // Limite seguro: comprometido = assinaturas ainda não lançadas no mês.
  const jaLancadoMes = new Set(
    txMes.filter((t) => t.valor < 0).map((t) => t.descricao.toLowerCase())
  );
  const comprometido = assinaturas
    .filter((a) => !jaLancadoMes.has(a.descricao.toLowerCase()))
    .reduce((s, a) => s + a.valorMedio, 0);
  const limite = calcularLimiteSeguro(rendaMes, gastoMes, comprometido, diasRestantesNoMes(hoje));

  return {
    numContas: contas.length,
    saldoContas,
    totalInvestido,
    faturas,
    faturaTotal,
    rendaMes,
    gastoMes,
    gastosPorCategoria,
    assinaturas,
    custoAssinaturas,
    duplicatas,
    limite,
    orcamentos,
  };
}
