"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOpenFinanceProvider } from "@/lib/openfinance";
import { syncItem, type SyncResult } from "@/lib/openfinance/sync";

/**
 * Server Functions da tela de Contas.
 *
 * ⚠️ Acessíveis via POST direto (não só pela UI) — cada uma RE-VERIFICA a
 * sessão antes de qualquer escrita, conforme guia de mutações do Next.js 16.
 * O sync roda com o client RLS do próprio usuário (menor privilégio).
 */

export type AcaoResultado =
  | { ok: true; resultado: SyncResult }
  | { ok: false; erro: string };

/** Conecta uma instituição (mock = consentimento simulado) e sincroniza. */
export async function conectarConta(
  institutionId: string
): Promise<AcaoResultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão expirada. Faça login novamente." };

  try {
    const provider = getOpenFinanceProvider();
    const item = await provider.createItem(institutionId);
    const resultado = await syncItem(supabase, user.id, item.itemId);

    revalidatePath("/contas");
    revalidatePath("/transacoes");
    return { ok: true, resultado };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Erro ao conectar." };
  }
}

/**
 * Gera um connect token para abrir o widget Pluggy Connect no frontend.
 * O usuário conclui o consentimento dentro do iframe do Pluggy; o widget devolve
 * o `itemId`, que o cliente sincroniza via `sincronizar`.
 */
export async function criarConnectToken(): Promise<
  { ok: true; token: string } | { ok: false; erro: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão expirada. Faça login novamente." };

  try {
    const { token } = await getOpenFinanceProvider().createConnectToken();
    return { ok: true, token };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Erro ao iniciar conexão." };
  }
}

/** Re-sincroniza um item já conectado. Idempotente — não duplica transações. */
export async function sincronizar(itemId: string): Promise<AcaoResultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão expirada. Faça login novamente." };

  try {
    const resultado = await syncItem(supabase, user.id, itemId);
    revalidatePath("/contas");
    revalidatePath("/transacoes");
    return { ok: true, resultado };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Erro ao sincronizar." };
  }
}
