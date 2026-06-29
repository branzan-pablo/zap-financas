import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getPlano, type PlanoId } from "./plans";

/**
 * Mutações de estado de assinatura.
 *
 * A tabela `subscriptions` só aceita escrita via service_role (RLS), então
 * estas funções recebem o ADMIN client — chamadas pelo webhook de pagamento e
 * pelo checkout mock (que simula o webhook). O gating de leitura é feito pelo
 * helper puro [access.ts](./access.ts).
 */

type DB = SupabaseClient<Database>;

/** Ativa (ou renova) a assinatura paga de um usuário. */
export async function ativarAssinatura(
  db: DB,
  userId: string,
  planoId: PlanoId,
  externalId: string,
  agora: Date = new Date()
): Promise<void> {
  const plano = getPlano(planoId);
  if (!plano) throw new Error(`Plano desconhecido: ${planoId}`);

  const fim = new Date(agora);
  fim.setMonth(fim.getMonth() + plano.meses);

  const { error } = await db.from("subscriptions").upsert(
    {
      user_id: userId,
      plano: planoId,
      status: "ativo",
      mp_subscription_id: externalId,
      periodo_inicio: agora.toISOString(),
      periodo_fim: fim.toISOString(),
      cancelado_em: null,
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(`Falha ao ativar assinatura: ${error.message}`);

  await db.from("profiles").update({ plano: "pago" }).eq("id", userId);
}

/** Marca a assinatura como cancelada (mantém acesso até o fim do período). */
export async function cancelarAssinatura(db: DB, userId: string): Promise<void> {
  const { error } = await db
    .from("subscriptions")
    .update({ status: "cancelado", cancelado_em: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw new Error(`Falha ao cancelar: ${error.message}`);
}

/** Marca a assinatura como inadimplente (falha de pagamento → dunning). */
export async function marcarInadimplente(db: DB, userId: string): Promise<void> {
  await db.from("subscriptions").update({ status: "inadimplente" }).eq("user_id", userId);
}

/** Encontra o user dono de uma assinatura pelo id externo (webhook). */
export async function userIdPorExternalId(
  db: DB,
  externalId: string
): Promise<string | null> {
  const { data } = await db
    .from("subscriptions")
    .select("user_id")
    .eq("mp_subscription_id", externalId)
    .maybeSingle();
  return data?.user_id ?? null;
}
