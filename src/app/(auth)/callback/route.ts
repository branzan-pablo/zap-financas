import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Callback de autenticação — atende DOIS fluxos, por motivos diferentes.
 *
 * ⚠️ O route group `(auth)` NÃO entra no path: a rota pública é `/callback`.
 *
 * 1. `?code=` (PKCE) — login social. O Google devolve um code na query, que
 *    trocamos por sessão.
 *
 * 2. `?token_hash=&type=` — links de e-mail (confirmação de cadastro e
 *    recuperação de senha).
 *
 * O segundo existe porque o fluxo padrão do Supabase para e-mail é o implícito:
 * o `{{ .ConfirmationURL }}` passa pelo /verify deles e volta com o token no
 * FRAGMENTO da URL (`#access_token=...`). Fragmento não é enviado ao servidor —
 * um route handler não consegue lê-lo nem em teoria. O resultado era o usuário
 * clicar no e-mail e cair em `/login?error=auth_callback_failed`, com a sessão
 * pendurada num pedaço de URL que ninguém consome.
 *
 * A saída é não usar o `{{ .ConfirmationURL }}`: os templates em
 * `supabase/templates/` montam o link com `{{ .TokenHash }}` apontando para cá,
 * em QUERY PARAMS, e `verifyOtp` fecha a sessão do lado do servidor. Se mexer
 * nos templates, mantenha `token_hash`, `type` e `next`.
 */

/** Tipos de OTP por e-mail que este app realmente dispara. */
const TIPOS_ACEITOS = new Set<EmailOtpType>([
  "recovery", // resetPasswordForEmail
  "signup", // signUp (confirmação de cadastro)
  "email_change",
]);

/**
 * Só aceita caminho interno.
 *
 * `next` vem da URL, e a URL vem de um e-mail — ou seja, de fora. Sem esta
 * checagem, `?next=//site-falso.com` faria o app redirecionar para um domínio
 * de terceiro logo depois de autenticar, que é a receita de phishing: o usuário
 * clica num link legítimo nosso, faz login de verdade, e aterrissa numa cópia
 * pedindo os dados do banco. Exigir uma barra só, sem esquema e sem host,
 * mantém o destino dentro do app.
 */
export function destinoSeguro(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const next = destinoSeguro(url.searchParams.get("next"));

  const supabase = await createClient();

  // Fluxo 1 — PKCE (login social).
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.warn(`callback: troca de code falhou — ${error.message}`);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // Fluxo 2 — link de e-mail.
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type && TIPOS_ACEITOS.has(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    // Causa mais comum: link expirado ou já usado. Não distinguimos os casos na
    // URL de erro — dizer "este link já foi usado" a quem não pediu o e-mail
    // confirmaria que a conta existe.
    console.warn(`callback: verifyOtp (${type}) falhou — ${error.message}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
