import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { syncItem } from "@/lib/openfinance/sync";

/**
 * Webhook do Pluggy (Open Finance) — eventos de atualização de item.
 *
 * Fluxo: valida a assinatura → extrai o itemId → descobre o(s) usuário(s)
 * dono(s) daquele item (via accounts.pluggy_item_id) → re-sincroniza.
 * Roda sem sessão de usuário, então usa o admin client (service_role).
 *
 * Segurança: se PLUGGY_WEBHOOK_SECRET estiver definido, exige HMAC-SHA256 do
 * corpo bruto no header `x-pluggy-signature`. Sem secret (dev/mock), aceita —
 * mas em produção o secret é obrigatório.
 *
 * Docs Pluggy: https://docs.pluggy.ai/docs/webhooks
 */

function assinaturaValida(rawBody: string, header: string | null): boolean {
  const secret = process.env.PLUGGY_WEBHOOK_SECRET;
  if (!secret) return true; // dev/mock: sem secret configurado
  if (!header) return false;

  const esperado = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(esperado);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!assinaturaValida(rawBody, request.headers.get("x-pluggy-signature"))) {
    return Response.json({ ok: false, error: "Assinatura inválida." }, { status: 401 });
  }

  let payload: { event?: string; itemId?: string; data?: { item?: { id?: string } } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  // Pluggy envia o itemId em formatos ligeiramente diferentes por evento.
  const itemId = payload.itemId ?? payload.data?.item?.id;
  if (!itemId) {
    return Response.json({ ok: false, error: "itemId ausente." }, { status: 422 });
  }

  const db = createAdminClient();

  // Descobre os usuários donos deste item (normalmente um).
  const { data: contas, error } = await db
    .from("accounts")
    .select("user_id")
    .eq("pluggy_item_id", itemId);
  if (error) {
    console.error("webhook pluggy: lookup falhou:", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }

  const userIds = [...new Set((contas ?? []).map((c) => c.user_id))];
  if (userIds.length === 0) {
    // Item desconhecido (ainda não conectado) — ack para o Pluggy não reenviar.
    return Response.json({ ok: true, ignored: "item desconhecido" });
  }

  try {
    const resultados = [];
    for (const userId of userIds) {
      resultados.push(await syncItem(db, userId, itemId));
    }
    return Response.json({ ok: true, event: payload.event ?? null, resultados });
  } catch (e) {
    console.error("webhook pluggy: sync falhou:", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
