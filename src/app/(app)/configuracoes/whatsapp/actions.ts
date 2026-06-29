"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Functions do pareamento de WhatsApp.
 * Re-verificam a sessão (acessíveis via POST direto). Escrevem com o client RLS
 * do próprio usuário.
 */

const CODIGO_TTL_MIN = 10;
// Alfabeto sem caracteres ambíguos (0/O, 1/I/L) para ditar/digitar fácil.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function gerarCodigo(): string {
  // randomInt (CSPRNG) — código de pareamento não deve ser previsível.
  let c = "";
  for (let i = 0; i < 6; i++) {
    c += ALFABETO[randomInt(ALFABETO.length)];
  }
  return c;
}

/** Gera (ou regenera) um código de pareamento para o usuário logado. */
export async function gerarCodigoPareamento() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const expira = new Date(Date.now() + CODIGO_TTL_MIN * 60_000).toISOString();

  // Omitimos `telefone` no upsert para não apagar um número já vinculado.
  const { error } = await supabase.from("whatsapp_links").upsert(
    {
      user_id: user.id,
      codigo_pareamento: gerarCodigo(),
      codigo_expira_em: expira,
      status: "pendente",
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(`Falha ao gerar código: ${error.message}`);

  revalidatePath("/configuracoes/whatsapp");
}

/** Desvincula o WhatsApp do usuário logado. */
export async function desvincularWhatsapp() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("whatsapp_links")
    .delete()
    .eq("user_id", user.id);
  if (error) throw new Error(`Falha ao desvincular: ${error.message}`);

  revalidatePath("/configuracoes/whatsapp");
}
