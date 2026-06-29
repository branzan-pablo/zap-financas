import type { SupabaseClient } from "@supabase/supabase-js";
import { getOpenFinanceProvider } from "./index";
import { getAIProvider } from "@/lib/ai";
import {
  categorizarPorRegras,
  type CategoriaRegra,
} from "@/lib/categorization/rules";

/**
 * Pipeline de sincronização Open Finance → Supabase.
 *
 * Coração da Fase 1. É IDEMPOTENTE:
 *   • contas → upsert por (user_id, pluggy_account_id);
 *   • transações → upsert por pluggy_tx_id (constraint única no schema).
 * Rodar N vezes não duplica nada.
 *
 * Recebe o client do Supabase como parâmetro (injeção de dependência), seguindo
 * o princípio de menor privilégio:
 *   • Server Action (usuário logado) → passa o client RLS de `createClient()`;
 *     as policies já permitem o usuário escrever as próprias linhas.
 *   • Webhook/cron (sem sessão)       → passa `createAdminClient()`.
 *
 * Categorização: regras determinísticas primeiro
 * ([categorization/rules.ts](../categorization/rules.ts)); só os casos sem
 * match caem no fallback de IA ([../ai](../ai/index.ts)), com cache por
 * descrição para minimizar chamadas.
 *
 * NOTA: investimentos e detecção de parcelas entram na etapa 1E — os ganchos
 * (`provider.fetchInvestments`, `tx.parcela`) já existem.
 */

export type SyncResult = {
  itemId: string;
  contas: number;
  transacoes: number;
  categorizadasPorRegra: number;
  categorizadasPorIA: number;
};

export async function syncItem(
  db: SupabaseClient,
  userId: string,
  itemId: string
): Promise<SyncResult> {
  const provider = getOpenFinanceProvider();

  // 1. Contas -----------------------------------------------------------------
  const ofAccounts = await provider.fetchAccounts(itemId);
  const agora = new Date().toISOString();

  const accountRows = ofAccounts.map((a) => ({
    user_id: userId,
    nome: a.nome,
    banco: a.banco,
    tipo: a.tipo,
    saldo: a.saldo,
    moeda: a.moeda,
    pluggy_item_id: itemId,
    pluggy_account_id: a.accountId,
    ativo: true,
    ultimo_sync: agora,
  }));

  const { data: upserted, error: accErr } = await db
    .from("accounts")
    .upsert(accountRows, { onConflict: "user_id,pluggy_account_id" })
    .select("id, pluggy_account_id");

  if (accErr) {
    throw new Error(`Falha ao sincronizar contas: ${accErr.message}`);
  }

  // pluggy_account_id → uuid da conta no banco
  const accountIdMap = new Map<string, string>();
  for (const row of upserted ?? []) {
    if (row.pluggy_account_id) accountIdMap.set(row.pluggy_account_id, row.id);
  }

  // 2. Categorias (globais + do usuário) -------------------------------------
  const { data: cats } = await db
    .from("categories")
    .select("id, nome, regras")
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order("created_at", { ascending: true });

  const categorias: CategoriaRegra[] = (cats ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    regras: Array.isArray(c.regras) ? (c.regras as string[]) : null,
  }));
  const candidatasIA = categorias.map((c) => ({ id: c.id, nome: c.nome }));

  // 3. Transações + categorização --------------------------------------------
  const ofTxs = await provider.fetchTransactions(itemId);

  const ai = getAIProvider();
  const cacheIA = new Map<string, string | null>(); // descrição → categoria id
  let porRegra = 0;
  let porIA = 0;

  const txRows = [];
  for (const t of ofTxs) {
    const accountId = accountIdMap.get(t.accountId);
    if (!accountId) continue; // conta não persistida (não deveria ocorrer)

    let categoryId = categorizarPorRegras(t.descricao, categorias);
    if (categoryId) {
      porRegra++;
    } else {
      // Fallback IA (com cache por descrição).
      const chave = t.descricao.toLowerCase();
      if (cacheIA.has(chave)) {
        categoryId = cacheIA.get(chave) ?? null;
      } else {
        const r = await ai.categorize(t.descricao, candidatasIA);
        categoryId = r.categoriaId;
        cacheIA.set(chave, categoryId);
      }
      if (categoryId) porIA++;
    }

    txRows.push({
      user_id: userId,
      account_id: accountId,
      category_id: categoryId,
      valor: t.valor,
      descricao: t.descricao,
      data: t.data,
      tipo: t.tipo,
      pluggy_tx_id: t.transactionId,
      origem: "openfinance",
    });
  }

  if (txRows.length > 0) {
    const { error: txErr } = await db
      .from("transactions")
      .upsert(txRows, { onConflict: "pluggy_tx_id" });
    if (txErr) {
      throw new Error(`Falha ao sincronizar transações: ${txErr.message}`);
    }
  }

  return {
    itemId,
    contas: accountRows.length,
    transacoes: txRows.length,
    categorizadasPorRegra: porRegra,
    categorizadasPorIA: porIA,
  };
}
