import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { formatBRL } from "@/lib/format";
import { faturaAtual, type FaturaTransacao } from "@/lib/fatura";
import {
  categorizarPorRegras,
  type CategoriaRegra,
} from "@/lib/categorization/rules";
import { getAIProvider } from "@/lib/ai";
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
  "• *gastei 50 no mercado* — registro um gasto";

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
    case "registrar":
      return registrar(db, userId, intent.valor, intent.descricao, hoje);
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

async function registrar(
  db: SupabaseClient<Database>,
  userId: string,
  valor: number,
  descricao: string,
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
  // Regras determinísticas primeiro; fallback de IA p/ casos ambíguos (igual ao sync).
  let categoryId = categorizarPorRegras(descricao, categorias);
  if (!categoryId) {
    const r = await getAIProvider().categorize(
      descricao,
      categorias.map((c) => ({ id: c.id, nome: c.nome }))
    );
    categoryId = r.categoriaId;
  }
  const catNome = categorias.find((c) => c.id === categoryId)?.nome;

  const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  const { error } = await db.from("transactions").insert({
    user_id: userId,
    account_id: conta.id,
    category_id: categoryId,
    valor: -Math.abs(valor),
    descricao,
    data,
    tipo: "debito",
    origem: "whatsapp",
  });
  if (error) return "Não consegui registrar agora. Tente de novo em instantes.";

  const cat = catNome ? ` em *${catNome}*` : "";
  return `Anotado: *${formatBRL(Math.abs(valor))}*${cat} — ${descricao}. ✅`;
}
