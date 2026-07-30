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

/** Tipos aceitos numa conta manual (sem Open Finance). */
const TIPOS_MANUAIS = ["corrente", "poupanca", "outro"] as const;

/**
 * Cria uma conta MANUAL — dinheiro na carteira, VR/VA, poupança de outro banco:
 * qualquer coisa que o Open Finance não traz.
 *
 * Fica sem `pluggy_item_id`/`pluggy_account_id`. O sync faz upsert por
 * (user_id, pluggy_account_id) e nunca deleta, e no Postgres valores NULL são
 * distintos numa constraint única — então contas manuais nunca colidem com as
 * conectadas nem são sobrescritas.
 */
export async function criarContaManual(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const nome = String(formData.get("nome") ?? "").trim().slice(0, 60);
  const tipoBruto = String(formData.get("tipo") ?? "outro");
  const tipo = (TIPOS_MANUAIS as readonly string[]).includes(tipoBruto)
    ? tipoBruto
    : "outro";
  const saldoBruto = String(formData.get("saldo") ?? "").trim().replace(",", ".");
  const saldo = saldoBruto === "" ? 0 : Number(saldoBruto);

  if (!nome || !Number.isFinite(saldo) || Math.abs(saldo) > 99_999_999) return;

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    nome,
    banco: null,
    tipo,
    saldo: Math.round(saldo * 100) / 100,
    moeda: "BRL",
    ativo: true,
  });
  if (error) throw new Error(`Falha ao criar conta: ${error.message}`);

  revalidatePath("/contas");
  revalidatePath("/dashboard");
}

/**
 * Arquiva uma conta manual (`ativo = false`) preservando o histórico de
 * transações — deletar a conta cascatearia e apagaria o extrato.
 *
 * Só vale para contas manuais: uma conta do Open Finance voltaria a `ativo=true`
 * no próximo sync, o que seria confuso para o usuário.
 */
export async function arquivarContaManual(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase
    .from("accounts")
    .update({ ativo: false })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("pluggy_account_id", null);
  if (error) throw new Error(`Falha ao arquivar conta: ${error.message}`);

  revalidatePath("/contas");
  revalidatePath("/dashboard");
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
