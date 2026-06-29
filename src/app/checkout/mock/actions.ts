"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPaymentsProvider } from "@/lib/payments";
import { ativarAssinatura } from "@/lib/payments/subscription";
import type { PlanoId } from "@/lib/payments/plans";

/**
 * Confirma o "pagamento" simulado e ativa a assinatura.
 *
 * Chama a MESMA função que o webhook real chamaria (`ativarAssinatura`), então
 * o caminho de ativação é idêntico — só a origem do gatilho muda.
 */
export async function confirmarPagamento(formData: FormData) {
  // Trava de segurança: o checkout simulado SÓ pode ativar assinatura no modo
  // mock. Com um provider real (Mercado Pago), a ativação vem do webhook
  // assinado — nunca desta ação. Impede ativar assinatura sem pagar em produção.
  if (getPaymentsProvider().nome !== "mock") {
    redirect("/assinar");
  }

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
