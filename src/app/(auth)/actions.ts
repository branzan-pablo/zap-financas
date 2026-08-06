"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
 * Regra de senha, validada no SERVIDOR.
 *
 * O `minLength` do input só vale no browser — estas actions são alcançáveis por
 * POST direto, então sem esta checagem a política real seria a do Supabase
 * (6 caracteres por padrão). Para um app com dados bancários, 12 é o piso.
 */
const SENHA_MIN = 12;

function validarSenha(password: string): string | null {
  if (password.length < SENHA_MIN) {
    return `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "A senha precisa misturar letras e números.";
  }
  return null;
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
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

  const senhaInvalida = validarSenha(password);
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
    return { error: error.message };
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

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl("/reset-password"),
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");

  const senhaInvalida = validarSenha(password);
  if (senhaInvalida) return { error: senhaInvalida };

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
