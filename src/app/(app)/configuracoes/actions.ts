"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Exclusão de conta (LGPD — direito de eliminação).
 *
 * Apaga o usuário em auth.users via admin; todas as tabelas têm FK
 * `on delete cascade`, então os dados financeiros são removidos junto.
 * Depois encerra a sessão e volta para a landing.
 */
export async function excluirConta() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(`Falha ao excluir conta: ${error.message}`);

  await supabase.auth.signOut();
  redirect("/");
}
