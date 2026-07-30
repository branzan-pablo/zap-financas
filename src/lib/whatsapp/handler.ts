import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { formatBRL } from "@/lib/format";
import { faturaAtual, type FaturaTransacao } from "@/lib/fatura";
import {
  categorizarPorRegras,
  type CategoriaRegra,
} from "@/lib/categorization/rules";
import { getAIProvider } from "@/lib/ai";
import { carregarFechamento } from "@/lib/monthly-close-data";
import { mensagemFechamento, mesAFechar } from "@/lib/monthly-close";
import { resumoFinanceiro } from "@/lib/finance-summary";
import { NIVEL_LABEL } from "@/lib/health-score";
import { carregarStreak } from "@/lib/streak-data";
import { mensagemStreak } from "@/lib/streak";
import type { Intent } from "./intent";

/**
 * Roteador de intenções do WhatsApp → ação sobre os dados → texto de resposta.
 *
 * Recebe o client Supabase (admin, vindo do webhook sem sessão). Cada handler
 * lê/escreve em nome do `userId` já resolvido pelo pareamento.
 */

const AJUDA =
  "Eu te ajudo com suas finanças por aqui 💚\n" +
  "• *saldo* — saldo nas suas contas\n" +
  "• *fatura* — fatura aberta dos cartões\n" +
  "• *gastos* — quanto você gastou no mês\n" +
  "• *fechamento* — o resumo do mês passado\n" +
  "• *score* — sua saúde financeira de 0 a 100\n" +
  "• *gastei 50 no mercado* — registro um gasto\n" +
  "• mande um *áudio* falando seus gastos\n" +
  "• mande a *foto da nota fiscal* que eu registro";

export async function responderIntent(
  db: SupabaseClient<Database>,
  userId: string,
  intent: Intent,
  hoje: Date = new Date()
): Promise<string> {
  switch (intent.tipo) {
    case "saldo":
      return saldo(db, userId);
    case "fatura":
      return fatura(db, userId, hoje);
    case "gastos":
      return gastos(db, userId, hoje);
    case "fechamento":
      return mensagemFechamento(
        await carregarFechamento(db, userId, mesAFechar(hoje)),
        formatBRL
      );
    case "score":
      return score(db, userId, hoje);
    case "registrar":
      return registrarLote(
        db,
        userId,
        [{ valor: intent.valor, descricao: intent.descricao }],
        hoje
      );
    case "registrar_lote":
      return registrarLote(db, userId, intent.itens, hoje);
    case "ajuda":
      return AJUDA;
    default:
      return `Não entendi 🤔\n\n${AJUDA}`;
  }
}

async function saldo(db: SupabaseClient<Database>, userId: string): Promise<string> {
  const { data } = await db
    .from("accounts")
    .select("saldo, tipo")
    .eq("user_id", userId)
    .eq("ativo", true);
  const total = (data ?? [])
    .filter((c) => c.tipo === "corrente" || c.tipo === "poupanca")
    .reduce((s, c) => s + (c.saldo ?? 0), 0);
  return `Seu saldo em contas é *${formatBRL(total)}*.`;
}

async function fatura(
  db: SupabaseClient<Database>,
  userId: string,
  hoje: Date
): Promise<string> {
  const { data: cards } = await db
    .from("cards")
    .select("nome, account_id, dia_fechamento, dia_vencimento")
    .eq("user_id", userId)
    .eq("ativo", true);
  if (!cards || cards.length === 0) return "Você não tem cartões conectados ainda.";

  const contaIds = cards.map((c) => c.account_id).filter((x): x is string => !!x);
  const { data: txs } = contaIds.length
    ? await db
        .from("transactions")
        .select("account_id, valor, data")
        .in("account_id", contaIds)
    : { data: [] };
  const porConta = new Map<string, FaturaTransacao[]>();
  for (const t of txs ?? []) {
    const arr = porConta.get(t.account_id) ?? [];
    arr.push({ valor: t.valor, data: t.data });
    porConta.set(t.account_id, arr);
  }

  const linhas: string[] = [];
  let total = 0;
  for (const c of cards) {
    if (!c.account_id || !c.dia_fechamento || !c.dia_vencimento) continue;
    const f = faturaAtual(porConta.get(c.account_id) ?? [], c.dia_fechamento, c.dia_vencimento, hoje);
    total += f.total;
    linhas.push(`• ${c.nome}: ${formatBRL(f.total)}`);
  }
  return `Sua fatura aberta é *${formatBRL(total)}*.\n${linhas.join("\n")}`;
}

async function gastos(
  db: SupabaseClient<Database>,
  userId: string,
  hoje: Date
): Promise<string> {
  const mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const { data } = await db
    .from("transactions")
    .select("valor, data, categories(nome)")
    .eq("user_id", userId)
    .gte("data", `${mes}-01`)
    .lt("valor", 0);
  const txs = (data ?? []) as { valor: number; categories: { nome: string } | null }[];

  const total = txs.reduce((s, t) => s - t.valor, 0);
  const porCat = new Map<string, number>();
  for (const t of txs) {
    const nome = t.categories?.nome ?? "Outros";
    porCat.set(nome, (porCat.get(nome) ?? 0) - t.valor);
  }
  const top = [...porCat.entries()].sort((a, b) => b[1] - a[1])[0];
  const extra = top ? `\nMaior categoria: ${top[0]} (${formatBRL(top[1])}).` : "";
  return `Você gastou *${formatBRL(total)}* este mês.${extra}`;
}

/** Score de saúde financeira + o que mais pesa contra, em formato de WhatsApp. */
async function score(
  db: SupabaseClient<Database>,
  userId: string,
  hoje: Date
): Promise<string> {
  const { score: s, numContas } = await resumoFinanceiro(db, userId, hoje);
  if (numContas === 0) {
    return "Ainda não consigo avaliar: conecte uma conta no app primeiro.";
  }

  const emoji = { excelente: "💚", bom: "🙂", atencao: "😐", critico: "🔴" }[s.nivel];
  const linhas = [`${emoji} *Saúde financeira: ${s.score}/100* — ${NIVEL_LABEL[s.nivel]}`];

  // Os dois componentes mais fracos explicam a nota sem virar um relatório.
  const fracos = [...s.componentes].sort((a, b) => a.nota - b.nota).slice(0, 2);
  if (fracos.length) {
    linhas.push("", ...fracos.map((c) => `• ${c.nome}: ${c.detalhe}`));
  }
  if (s.dicas.length) {
    linhas.push("", "*Para melhorar:*", ...s.dicas.slice(0, 2).map((d) => `• ${d}`));
  }
  return linhas.join("\n");
}

/**
 * Registra um ou mais gastos (texto "gastei X", NLU multi-gasto, áudio, nota
 * fiscal). Uma leitura de contas/categorias, um insert em lote, resposta única.
 */
async function registrarLote(
  db: SupabaseClient<Database>,
  userId: string,
  itens: { valor: number; descricao: string }[],
  hoje: Date
): Promise<string> {
  // Conta de destino: a primeira conta ativa (preferindo corrente).
  const { data: contas } = await db
    .from("accounts")
    .select("id, tipo")
    .eq("user_id", userId)
    .eq("ativo", true);
  if (!contas || contas.length === 0) {
    return "Para registrar gastos, conecte uma conta primeiro no app.";
  }
  const conta = contas.find((c) => c.tipo === "corrente") ?? contas[0];

  // Categoriza por regras (globais + do usuário).
  const { data: cats } = await db
    .from("categories")
    .select("id, nome, regras")
    .or(`user_id.is.null,user_id.eq.${userId}`);
  const categorias: CategoriaRegra[] = (cats ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    regras: Array.isArray(c.regras) ? (c.regras as string[]) : null,
  }));

  const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  const linhas: string[] = [];
  const rows = [];
  for (const item of itens) {
    // Regras determinísticas primeiro; fallback de IA p/ casos ambíguos (igual ao sync).
    let categoryId = categorizarPorRegras(item.descricao, categorias);
    if (!categoryId) {
      const r = await getAIProvider().categorize(
        item.descricao,
        categorias.map((c) => ({ id: c.id, nome: c.nome }))
      );
      categoryId = r.categoriaId;
    }
    const catNome = categorias.find((c) => c.id === categoryId)?.nome;
    rows.push({
      user_id: userId,
      account_id: conta.id,
      category_id: categoryId,
      valor: -Math.abs(item.valor),
      descricao: item.descricao,
      data,
      tipo: "debito",
      origem: "whatsapp",
    });
    linhas.push(
      `• *${formatBRL(Math.abs(item.valor))}*${catNome ? ` em *${catNome}*` : ""} — ${item.descricao}`
    );
  }

  const { error } = await db.from("transactions").insert(rows);
  if (error) return "Não consegui registrar agora. Tente de novo em instantes.";

  const base =
    itens.length === 1
      ? `Anotado: ${linhas[0].slice(2)}. ✅`
      : `Anotado ✅\n${linhas.join("\n")}\nTotal: *${formatBRL(
          itens.reduce((s, i) => s + Math.abs(i.valor), 0)
        )}*`;

  // Incentivo ao hábito: só em marcos da sequência, para não virar spam.
  const comemoracao = mensagemStreak(await carregarStreak(db, userId, hoje));
  return comemoracao ? `${base}\n\n${comemoracao}` : base;
}
