import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentsProvider } from "@/lib/payments";
import { WebhookSignatureError } from "@/lib/payments/provider";
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

  // Fail closed: em produção o webhook NÃO pode rodar com o provider mock (que
  // não valida assinatura) — evita aceitar eventos forjados. A factory já lança
  // nesse caso; convertemos em 503 para o MP reenviar depois do fix, em vez de
  // devolver um 500 com stack trace.
  let provider;
  try {
    provider = getPaymentsProvider();
  } catch {
    return Response.json({ ok: false, error: "Pagamentos não configurados." }, { status: 503 });
  }
  if (process.env.NODE_ENV === "production" && provider.nome === "mock") {
    return Response.json({ ok: false, error: "Pagamentos não configurados." }, { status: 503 });
  }

  let evento;
  try {
    evento = await provider.parseWebhook(rawBody, request);
  } catch (e) {
    if (e instanceof WebhookSignatureError) {
      // Assinatura forjada/incorreta → rejeita. As notificações reais do MP são
      // assinadas corretamente, então nunca caem aqui.
      return Response.json({ ok: false, error: "Assinatura inválida." }, { status: 401 });
    }
    throw e;
  }
  if (!evento) {
    // Evento ignorável (tópico não tratado, recurso inexistente) → 200 ack.
    return Response.json({ ok: true, ignored: "evento ignorável" });
  }

  const db = createAdminClient();
  let { data: sub } = await db
    .from("subscriptions")
    .select("user_id, plano")
    .eq("mp_subscription_id", evento.externalId)
    .maybeSingle();

  // Segunda via: o `external_reference` é o `user_id` que mandamos ao criar o
  // checkout. Sem isto, um usuário que abandona o checkout e volta depois —
  // gerando um segundo preapproval, porque a janela de idempotência do MP é
  // curta — pagaria pelo link antigo e não seria ativado, já que só o id mais
  // recente fica gravado. O evento cairia como "assinatura desconhecida" e o
  // dinheiro entraria sem liberar o acesso.
  if (!sub && evento.externalReference) {
    const { data: porRef } = await db
      .from("subscriptions")
      .select("user_id, plano")
      .eq("user_id", evento.externalReference)
      .maybeSingle();
    if (porRef) {
      console.warn(
        `webhook mercadopago: ${evento.externalId} não estava gravado; ` +
          `resolvido pelo external_reference (user ${porRef.user_id}).`
      );
      sub = porRef;
      // Passa a seguir o preapproval que o MP de fato autorizou — senão um
      // cancelamento futuro iria para o id antigo e o MP seguiria cobrando.
      if (evento.tipo === "aprovado") {
        await db
          .from("subscriptions")
          .update({ mp_subscription_id: evento.externalId })
          .eq("user_id", porRef.user_id);
      }
    }
  }

  if (!sub) {
    // Assinatura desconhecida — ack para o MP não reenviar.
    return Response.json({ ok: true, ignored: "assinatura desconhecida" });
  }

  try {
    switch (evento.tipo) {
      case "aprovado":
        await ativarAssinatura(
          db,
          sub.user_id,
          sub.plano as PlanoId,
          evento.externalId,
          undefined,
          evento.periodoFim
        );
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
