import { createAdminClient } from "@/lib/supabase/server";
import { CARENCIA_DIAS } from "@/lib/payments/access";

/**
 * Cron de dunning (cobrança/inadimplência).
 *
 * Transições do ciclo de vida da assinatura:
 *   • ativo + período vencido      → inadimplente (renovação não confirmada)
 *   • inadimplente além da carência → expirado (corta acesso; perfil volta a gratuito)
 *
 * Em produção real, a renovação automática do Mercado Pago dispara webhooks que
 * já marcam inadimplência; este cron é a rede de segurança / estado final.
 *
 * Protegido por CRON_SECRET (fail closed em produção).
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return Response.json({ ok: false, error: "Cron não configurado." }, { status: 503 });
    }
  } else if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const db = createAdminClient();
  const agora = new Date();
  const agoraIso = agora.toISOString();

  // 1. Ativas vencidas → inadimplente.
  const { data: vencidas } = await db
    .from("subscriptions")
    .update({ status: "inadimplente" })
    .eq("status", "ativo")
    .lt("periodo_fim", agoraIso)
    .select("user_id");

  // 2. Inadimplentes além da carência → expirado + perfil gratuito.
  const limiteCarencia = new Date(agora);
  limiteCarencia.setDate(limiteCarencia.getDate() - CARENCIA_DIAS);
  const { data: expiradas } = await db
    .from("subscriptions")
    .update({ status: "expirado" })
    .eq("status", "inadimplente")
    .lt("periodo_fim", limiteCarencia.toISOString())
    .select("user_id");

  for (const s of expiradas ?? []) {
    await db.from("profiles").update({ plano: "gratuito" }).eq("id", s.user_id);
  }

  return Response.json({
    ok: true,
    inadimplentes: vencidas?.length ?? 0,
    expiradas: expiradas?.length ?? 0,
  });
}
