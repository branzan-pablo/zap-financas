"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { traduzirErroAuth } from "@/lib/auth/erros";
import { validarEmail, validarSenhaNova } from "@/lib/auth/validacao";

/**
 * Origem do app para as URLs de retorno do Supabase.
 *
 * ⚠️ O handler de callback vive em `src/app/(auth)/callback/route.ts`. O route
 * group `(auth)` NÃO entra no path, então a rota pública é `/callback` — não
 * `/auth/callback`. Errar isso manda confirmação de email, OAuth e reset de
 * senha para um 404.
 *
 * Todas as URLs abaixo precisam estar na allowlist do Supabase
 * (Authentication → URL Configuration → Redirect URLs).
 */
function callbackUrl(next?: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${base.replace(/\/$/, "")}/callback`;
  return next ? `${url}?next=${encodeURIComponent(next)}` : url;
}

/**
 * A política de senha e o texto dos erros moram em `@/lib/auth/validacao` —
 * o formulário lê as MESMAS funções para responder antes do round-trip.
 *
 * A validação aqui não é redundância: estas actions são alcançáveis por POST
 * direto, e sem elas a política real seria a do Supabase (6 caracteres por
 * padrão). Para um app com dados bancários, 12 é o piso.
 */

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: traduzirErroAuth(error.message) };
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const consentiu = formData.get("lgpd_consent") === "on";

  if (!consentiu) {
    return { error: "É preciso aceitar a Política de Privacidade para continuar." };
  }

  const emailInvalido = validarEmail(email);
  if (emailInvalido) return { error: emailInvalido };

  const senhaInvalida = validarSenhaNova(password);
  if (senhaInvalida) return { error: senhaInvalida };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // lgpd_consent é lido pelo trigger handle_new_user para registrar o consentimento.
      data: { full_name: nome, lgpd_consent: "true" },
      emailRedirectTo: callbackUrl(),
    },
  });

  if (error) {
    return { error: traduzirErroAuth(error.message) };
  }

  // Return success so the UI can show "check your email"
  return { success: true };
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl(),
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    return { error: error?.message ?? "Erro ao iniciar login com Google." };
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const emailInvalido = validarEmail(email);
  if (emailInvalido) return { error: emailInvalido };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl("/reset-password"),
  });

  if (error) {
    return { error: traduzirErroAuth(error.message) };
  }

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");

  const senhaInvalida = validarSenhaNova(password);
  if (senhaInvalida) return { error: senhaInvalida };

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: traduzirErroAuth(error.message) };
  }

  redirect("/dashboard");
}
