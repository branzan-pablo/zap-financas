"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPaymentsProvider } from "@/lib/payments";
import { getPlano } from "@/lib/payments/plans";
import { cancelarAssinatura } from "@/lib/payments/subscription";

/**
 * Server Functions de assinatura. Re-verificam a sessão.
 * O estado da assinatura é escrito via admin client (subscriptions só aceita
 * escrita por service_role).
 */

/** Inicia o checkout de um plano e redireciona para o provider. */
export async function iniciarCheckout(formData: FormData) {
  const planoId = String(formData.get("plano") ?? "");
  const plano = getPlano(planoId);
  if (!plano) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const provider = getPaymentsProvider();
  const { url, externalId } = await provider.criarCheckout({
    userId: user.id,
    payerEmail: user.email ?? "",
    plano,
    urlSucesso: `${appUrl}/dashboard`,
    urlCancelamento: `${appUrl}/assinar`,
  });

  // Cria/atualiza uma assinatura PENDENTE com o id externo, p/ o webhook
  // conseguir resolver o usuário quando o pagamento for confirmado.
  const admin = createAdminClient();
  await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      plano: planoId,
      status: "pendente",
      mp_subscription_id: externalId,
    },
    { onConflict: "user_id" }
  );

  redirect(url);
}

/** Cancela a assinatura do usuário (mantém acesso até o fim do período). */
export async function cancelarMinhaAssinatura() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("mp_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Cancela PRIMEIRO no provider; só atualiza local se isso suceder — senão o
  // MP continuaria cobrando enquanto o usuário acha que cancelou.
  if (sub?.mp_subscription_id) {
    await getPaymentsProvider().cancelar(sub.mp_subscription_id);
  }
  await cancelarAssinatura(admin, user.id);
  revalidatePath("/assinar");
}
