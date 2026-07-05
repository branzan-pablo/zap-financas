import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { syncItem } from "@/lib/openfinance/sync";

/**
 * Webhook do Pluggy (Open Finance) — eventos de atualização de item.
 *
 * Fluxo: valida o token → extrai o itemId → descobre o(s) usuário(s) dono(s)
 * daquele item (via accounts.pluggy_item_id) → re-sincroniza. Roda sem sessão
 * de usuário, então usa o admin client (service_role).
 *
 * Segurança: o Pluggy NÃO assina os webhooks com HMAC (o modelo dele é
 * re-consultar o recurso na API autenticada — que o sync já faz). Validamos um
 * token compartilhado na querystring da URL registrada
 * (`/api/webhooks/pluggy?token=PLUGGY_WEBHOOK_SECRET`). Mesmo sem o token, um
 * evento forjado só conseguiria forçar um re-sync de um item já conectado
 * (nenhum dado é injetado — tudo é buscado autenticado no Pluggy).
 *
 * Docs Pluggy: https://docs.pluggy.ai/docs/webhooks
 */

function autorizado(request: Request): boolean {
  const secret = process.env.PLUGGY_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed em produção; dev aceita para facilitar os testes locais.
    return process.env.NODE_ENV !== "production";
  }
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!autorizado(request)) {
    return Response.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const rawBody = await request.text();

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
