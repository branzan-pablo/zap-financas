import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentsProvider } from "@/lib/payments";
import {
  ativarAssinatura,
  cancelarAssinatura,
  marcarInadimplente,
} from "@/lib/payments/subscription";
import type { PlanoId } from "@/lib/payments/plans";

/**
 * Webhook do Mercado Pago — eventos de pagamento/assinatura.
 *
 * A validação de assinatura (x-signature) fica dentro de `provider.parseWebhook`
 * (específica do MP). Resolve a assinatura pelo id externo e atualiza o estado;
 * a ativação usa a MESMA função do checkout. Sem sessão → admin client.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const provider = getPaymentsProvider();

  const evento = await provider.parseWebhook(rawBody, request.headers);
  if (!evento) {
    return Response.json({ ok: false, error: "Evento inválido." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: sub } = await db
    .from("subscriptions")
    .select("user_id, plano")
    .eq("mp_subscription_id", evento.externalId)
    .maybeSingle();
  if (!sub) {
    // Assinatura desconhecida — ack para o MP não reenviar.
    return Response.json({ ok: true, ignored: "assinatura desconhecida" });
  }

  try {
    switch (evento.tipo) {
      case "aprovado":
        await ativarAssinatura(db, sub.user_id, sub.plano as PlanoId, evento.externalId);
        break;
      case "cancelado":
        await cancelarAssinatura(db, sub.user_id);
        break;
      case "falha_pagamento":
        await marcarInadimplente(db, sub.user_id);
        break;
    }
    return Response.json({ ok: true, tipo: evento.tipo });
  } catch (e) {
    console.error("webhook mercadopago: falha ao atualizar estado:", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
