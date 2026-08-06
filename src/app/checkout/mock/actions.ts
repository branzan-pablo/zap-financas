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
  // Trava de segurança em DUAS camadas — esta ação concede acesso pago sem
  // cobrar nada, então não pode depender de uma única condição.
  //
  //  1. NODE_ENV: em produção não existe caso legítimo de uso. Esta checagem não
  //     depende de nenhuma env var de negócio — se PAYMENTS_PROVIDER sumisse ou
  //     viesse com typo, a antiga trava (só pelo nome do provider) ABRIRIA, e
  //     qualquer usuário logado viraria assinante pago de graça.
  //  2. Provider: fora de produção, só o mock ativa por aqui. Com o Mercado Pago
  //     configurado, a ativação vem exclusivamente do webhook assinado.
  if (process.env.NODE_ENV === "production") {
    redirect("/assinar");
  }
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
