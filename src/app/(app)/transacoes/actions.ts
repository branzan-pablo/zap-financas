"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorizarAuto } from "@/lib/categorization/auto";

/**
 * Lançamento manual de transação (dinheiro, VR, qualquer gasto que o Open
 * Finance não traz).
 *
 * ⚠️ Acessível via POST direto — re-verifica a sessão e escreve com o client RLS
 * do próprio usuário.
 *
 * Saldo: contas MANUAIS têm o saldo ajustado pelo lançamento (é a única fonte
 * de verdade delas). Contas do Open Finance NÃO — quem manda no saldo é o banco,
 * e o próximo sync sobrescreveria qualquer ajuste nosso.
 */
export async function criarLancamento(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const descricao = String(formData.get("descricao") ?? "").trim().slice(0, 120);
  const contaId = String(formData.get("conta") ?? "");
  const categoriaEscolhida = String(formData.get("categoria") ?? "");
  const entrada = String(formData.get("tipo") ?? "gasto") === "entrada";

  const valorBruto = String(formData.get("valor") ?? "").trim().replace(",", ".");
  const valor = Number(valorBruto);
  if (!descricao || !contaId || !Number.isFinite(valor) || valor <= 0 || valor > 99_999_999) {
    return;
  }

  const dataBruta = String(formData.get("data") ?? "");
  const hoje = new Date();
  const data = /^\d{4}-\d{2}-\d{2}$/.test(dataBruta)
    ? dataBruta
    : `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  // A conta tem de ser do usuário (RLS já limita; buscamos para confirmar que
  // existe e é dele antes de lançar).
  const { data: conta } = await supabase
    .from("accounts")
    .select("id")
    .eq("id", contaId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!conta) return;

  const categoryId =
    categoriaEscolhida || (await categorizarAuto(supabase, user.id, descricao));

  const assinado = entrada ? Math.abs(valor) : -Math.abs(valor);
  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    account_id: conta.id,
    category_id: categoryId,
    valor: Math.round(assinado * 100) / 100,
    descricao,
    data,
    tipo: entrada ? "credito" : "debito",
    origem: "manual",
  });
  if (error) throw new Error(`Falha ao lançar: ${error.message}`);

  // Ajuste atômico: um único UPDATE `saldo = saldo + delta` no Postgres. Ler o
  // saldo aqui e escrever de volta perderia lançamentos concorrentes (app +
  // WhatsApp ao mesmo tempo). A função só toca em contas manuais e respeita RLS.
  await supabase.rpc("ajustar_saldo", { p_conta_id: conta.id, p_delta: assinado });

  revalidatePath("/transacoes");
  revalidatePath("/contas");
  revalidatePath("/dashboard");
}

/**
 * Exclui um lançamento MANUAL (feito no app ou pelo WhatsApp). Transações vindas
 * do Open Finance não podem ser apagadas — o sync as recriaria.
 * Desfaz também o efeito no saldo, se a conta for manual.
 */
export async function excluirLancamento(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: tx } = await supabase
    .from("transactions")
    .select("id, valor, account_id, origem")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!tx || tx.origem === "openfinance") return;

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", tx.id)
    .eq("user_id", user.id);
  if (error) throw new Error(`Falha ao excluir: ${error.message}`);

  // Desfaz o efeito no saldo — atômico, mesma razão do lançamento.
  await supabase.rpc("ajustar_saldo", {
    p_conta_id: tx.account_id,
    p_delta: -tx.valor,
  });

  revalidatePath("/transacoes");
  revalidatePath("/contas");
  revalidatePath("/dashboard");
}
