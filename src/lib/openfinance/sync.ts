import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
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
 *   • contas       → upsert por (user_id, pluggy_account_id);
 *   • transações   → upsert por pluggy_tx_id (único);
 *   • cartões      → upsert por pluggy_card_id (único);
 *   • parcelas     → upsert por transaction_id (único);
 *   • investimentos→ upsert por pluggy_inv_id (único).
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
 */

export type SyncResult = {
  itemId: string;
  contas: number;
  transacoes: number;
  cartoes: number;
  parcelas: number;
  investimentos: number;
  categorizadasPorRegra: number;
  categorizadasPorIA: number;
};

/** Data da 1ª parcela = data da transação menos (parcelaAtual-1) meses. */
function primeiraParcela(dataTx: string, parcelaAtual: number): string {
  const d = new Date(dataTx + "T12:00:00");
  d.setMonth(d.getMonth() - (parcelaAtual - 1));
  return d.toISOString().slice(0, 10);
}

export async function syncItem(
  db: SupabaseClient<Database>,
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

  // pluggy_tx_id → uuid da transação (necessário p/ vincular parcelas)
  const txIdMap = new Map<string, string>();
  if (txRows.length > 0) {
    const { data: txUpserted, error: txErr } = await db
      .from("transactions")
      .upsert(txRows, { onConflict: "pluggy_tx_id" })
      .select("id, pluggy_tx_id");
    if (txErr) {
      throw new Error(`Falha ao sincronizar transações: ${txErr.message}`);
    }
    for (const row of txUpserted ?? []) {
      if (row.pluggy_tx_id) txIdMap.set(row.pluggy_tx_id, row.id);
    }
  }

  // 4. Cartões ----------------------------------------------------------------
  const ofCards = await provider.fetchCards(itemId);
  const cardByAccountUuid = new Map<string, string>(); // account uuid → card uuid
  if (ofCards.length > 0) {
    const cardRows = ofCards
      .map((c) => {
        const accountUuid = accountIdMap.get(c.accountId);
        if (!accountUuid) return null;
        return {
          user_id: userId,
          account_id: accountUuid,
          nome: c.nome,
          bandeira: c.bandeira,
          limite: c.limite,
          dia_fechamento: c.diaFechamento,
          dia_vencimento: c.diaVencimento,
          ativo: true,
          pluggy_card_id: c.cardId,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (cardRows.length > 0) {
      const { data: cardUpserted, error: cardErr } = await db
        .from("cards")
        .upsert(cardRows, { onConflict: "pluggy_card_id" })
        .select("id, account_id");
      if (cardErr) {
        throw new Error(`Falha ao sincronizar cartões: ${cardErr.message}`);
      }
      for (const row of cardUpserted ?? []) {
        if (row.account_id) cardByAccountUuid.set(row.account_id, row.id);
      }
    }
  }

  // 5. Parcelas (transações com metadados de parcelamento) --------------------
  const installmentRows = [];
  for (const t of ofTxs) {
    if (!t.parcela) continue;
    const txUuid = txIdMap.get(t.transactionId);
    const accountUuid = accountIdMap.get(t.accountId);
    if (!txUuid) continue;
    installmentRows.push({
      user_id: userId,
      card_id: accountUuid ? cardByAccountUuid.get(accountUuid) ?? null : null,
      transaction_id: txUuid,
      descricao: t.descricao,
      valor_parcela: Math.abs(t.valor),
      total_parcelas: t.parcela.total,
      parcela_atual: t.parcela.atual,
      primeira_parcela: primeiraParcela(t.data, t.parcela.atual),
    });
  }
  if (installmentRows.length > 0) {
    const { error: instErr } = await db
      .from("installments")
      .upsert(installmentRows, { onConflict: "transaction_id" });
    if (instErr) {
      throw new Error(`Falha ao sincronizar parcelas: ${instErr.message}`);
    }
  }

  // 6. Investimentos ----------------------------------------------------------
  const ofInvestments = await provider.fetchInvestments(itemId);
  const investmentRows = ofInvestments
    .map((inv) => {
      const accountUuid = accountIdMap.get(inv.accountId);
      if (!accountUuid) return null;
      return {
        user_id: userId,
        account_id: accountUuid,
        nome: inv.nome,
        tipo: inv.tipo,
        valor_aplicado: inv.valorAplicado,
        valor_atual: inv.valorAtual,
        rendimento_pct: inv.rendimentoPct,
        data_aplicacao: inv.dataAplicacao ?? null,
        data_vencimento: inv.dataVencimento ?? null,
        pluggy_inv_id: inv.investmentId,
        ultimo_sync: agora,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (investmentRows.length > 0) {
    const { error: invErr } = await db
      .from("investments")
      .upsert(investmentRows, { onConflict: "pluggy_inv_id" });
    if (invErr) {
      throw new Error(`Falha ao sincronizar investimentos: ${invErr.message}`);
    }
  }

  return {
    itemId,
    contas: accountRows.length,
    transacoes: txRows.length,
    cartoes: ofCards.length,
    parcelas: installmentRows.length,
    investimentos: investmentRows.length,
    categorizadasPorRegra: porRegra,
    categorizadasPorIA: porIA,
  };
}
