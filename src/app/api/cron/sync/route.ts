import { createAdminClient } from "@/lib/supabase/server";
import { syncItem } from "@/lib/openfinance/sync";

/**
 * Cron de sincronização recorrente — re-sincroniza todos os itens ativos.
 *
 * Pensado para ser disparado por um agendador (Vercel Cron ou Supabase
 * pg_cron/Edge Function) em intervalo fixo. Roda sem sessão → admin client.
 *
 * Segurança: exige `Authorization: Bearer <CRON_SECRET>`. O Vercel Cron envia
 * automaticamente esse header quando CRON_SECRET está nas env vars do projeto.
 *
 * NOTA: o sync é idempotente, então re-rodar é seguro (não duplica nada).
 */

// Nunca cachear: sempre executa ao ser chamado.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ ok: false, error: "Não autorizado." }, { status: 401 });
    }
  }

  const db = createAdminClient();

  // Pares (usuário, item) ativos a sincronizar.
  const { data: contas, error } = await db
    .from("accounts")
    .select("user_id, pluggy_item_id")
    .eq("ativo", true)
    .not("pluggy_item_id", "is", null);
  if (error) {
    console.error("cron sync: lookup falhou:", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }

  // Deduplica por (user_id, item).
  const pares = new Map<string, { userId: string; itemId: string }>();
  for (const c of contas ?? []) {
    const key = `${c.user_id}::${c.pluggy_item_id}`;
    if (!pares.has(key)) {
      pares.set(key, { userId: c.user_id, itemId: c.pluggy_item_id });
    }
  }

  let ok = 0;
  let falhas = 0;
  for (const { userId, itemId } of pares.values()) {
    try {
      await syncItem(db, userId, itemId);
      ok++;
    } catch (e) {
      falhas++;
      console.error(`cron sync: item ${itemId} falhou:`, e);
    }
  }

  return Response.json({ ok: true, itens: pares.size, sincronizados: ok, falhas });
}
