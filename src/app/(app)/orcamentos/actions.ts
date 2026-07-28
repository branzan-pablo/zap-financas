"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Function dos orçamentos por categoria.
 *
 * Re-verifica a sessão (acessível via POST direto) e escreve com o client RLS
 * do próprio usuário. Grava a linha do MÊS CORRENTE (upsert pela unique
 * user+categoria+mês): o valor passa a valer deste mês em diante (carry-over
 * resolvido na leitura — ver src/lib/budgets.ts). `limite = 0` desliga o
 * orçamento sem apagar o histórico dos meses anteriores.
 */
export async function definirOrcamento(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const categoryId = String(formData.get("categoria") ?? "");
  const bruto = String(formData.get("limite") ?? "").trim().replace(",", ".");
  const limite = bruto === "" ? 0 : Number(bruto);
  if (!categoryId || !Number.isFinite(limite) || limite < 0 || limite > 9_999_999) {
    return;
  }

  const hoje = new Date();
  const mesRef = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: categoryId,
      limite: Math.round(limite * 100) / 100,
      mes_referencia: mesRef,
    },
    { onConflict: "user_id,category_id,mes_referencia" }
  );
  if (error) throw new Error(`Falha ao salvar orçamento: ${error.message}`);

  revalidatePath("/orcamentos");
  revalidatePath("/dashboard");
}
