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
  agora: Date = new Date(),
  periodoFimIso?: string
): Promise<void> {
  const plano = getPlano(planoId);
  if (!plano) throw new Error(`Plano desconhecido: ${planoId}`);

  // O fim do ciclo é, idealmente, o informado pelo provider (fonte da verdade);
  // só calculamos localmente (now + meses) quando ele não vem (ex.: mock).
  const calculado = (() => {
    const d = new Date(agora);
    d.setMonth(d.getMonth() + plano.meses);
    return d;
  })();

  // Rede de segurança contra uma data ruim vinda do provider.
  //
  // Numa assinatura `pending` o Mercado Pago devolve `next_payment_date` igual
  // ao instante da criação — verificado. Se ele fizer o mesmo na autorização,
  // gravaríamos um `periodo_fim` já vencido: a pessoa paga e o paywall bloqueia
  // no segundo seguinte, sem nada no sistema apontando o motivo.
  //
  // Diante da dúvida, erra-se a favor de quem pagou: uma data no passado ou
  // ilegível vira o ciclo calculado. O custo máximo é dar acesso a mais do que
  // o devido até a próxima cobrança confirmar a data real — o oposto custaria
  // um cliente e um chargeback.
  const informado = periodoFimIso ? new Date(periodoFimIso) : null;
  const informadoUtil =
    informado && !Number.isNaN(informado.getTime()) && informado > agora;
  if (periodoFimIso && !informadoUtil) {
    console.warn(
      `ativarAssinatura: periodo_fim "${periodoFimIso}" do provider é inválido ` +
        `ou não é futuro; usando o ciclo calculado (${calculado.toISOString()}).`
    );
  }
  const fim = informadoUtil ? informado : calculado;

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
