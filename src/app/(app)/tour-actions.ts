"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Marca o tour de onboarding como visto (concluído OU pulado — nos dois casos
 * não insistimos de novo).
 *
 * ⚠️ Acessível via POST direto: re-verifica a sessão e escreve com o client RLS
 * do próprio usuário, que só alcança a própria linha de `profiles`.
 */
export async function concluirTour(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_done_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    // Falhar aqui não pode quebrar a experiência: no pior caso o tour reaparece.
    console.error("concluirTour: falha ao marcar onboarding:", error.message);
    return;
  }

  revalidatePath("/dashboard");
}
