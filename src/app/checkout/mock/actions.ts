"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ativarAssinatura } from "@/lib/payments/subscription";
import type { PlanoId } from "@/lib/payments/plans";

/**
 * Confirma o "pagamento" simulado e ativa a assinatura.
 *
 * Chama a MESMA função que o webhook real chamaria (`ativarAssinatura`), então
 * o caminho de ativação é idêntico — só a origem do gatilho muda.
 */
export async function confirmarPagamento(formData: FormData) {
  const planoId = String(formData.get("plano") ?? "") as PlanoId;
  const externalId = String(formData.get("ext") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ativarAssinatura(createAdminClient(), user.id, planoId, externalId);
  redirect("/dashboard");
}
