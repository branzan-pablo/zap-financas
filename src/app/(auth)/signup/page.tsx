"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp, signInWithGoogle } from "../actions";
import {
  AuthCard,
  AuthDivider,
  AuthError,
  AuthInput,
  AuthLabel,
  AuthSubmit,
  AuthSuccess,
  AuthTitle,
  GoogleButton,
} from "@/components/auth/auth-shell";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUp(fd);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(true);
      }
    });
  }

  function handleGoogle() {
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) setError(result.error);
    });
  }

  if (success) {
    return (
      <AuthSuccess
        titulo="Confirme seu email"
        descricao="Enviamos um link de confirmação para o seu email. Clique nele para ativar sua conta e começar o trial de 14 dias."
      >
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-emerald hover:underline"
        >
          Voltar para o login
        </Link>
      </AuthSuccess>
    );
  }

  return (
    <AuthCard>
      <AuthTitle>Criar conta</AuthTitle>
      <p className="mt-1 text-sm text-slate">
        14 dias grátis, sem cartão.{" "}
        <Link href="/login" className="text-emerald hover:underline">
          Já tenho conta
        </Link>
      </p>

      {error && <AuthError>{error}</AuthError>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <AuthLabel htmlFor="nome">Nome</AuthLabel>
          <AuthInput
            id="nome"
            name="nome"
            type="text"
            autoComplete="name"
            required
            placeholder="Seu nome"
            disabled={isPending}
          />
        </div>

        <div>
          <AuthLabel htmlFor="email">Email</AuthLabel>
          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            placeholder="seu@email.com"
            disabled={isPending}
          />
        </div>

        <div>
          <AuthLabel htmlFor="password">Senha</AuthLabel>
          <AuthInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            placeholder="Mínimo 12 caracteres, com letras e números"
            disabled={isPending}
          />
        </div>

        <label className="flex items-start gap-2.5 text-xs text-slate">
          <input
            type="checkbox"
            name="lgpd_consent"
            required
            disabled={isPending}
            className="mt-0.5 size-4 shrink-0 rounded border-line text-emerald focus:ring-emerald/30"
          />
          <span>
            Li e aceito a{" "}
            <Link href="/privacidade" className="text-emerald hover:underline">
              Política de Privacidade
            </Link>{" "}
            e autorizo o tratamento dos meus dados conforme a LGPD.
          </span>
        </label>

        <AuthSubmit pending={isPending} pendingLabel="Criando conta…" className="mt-2">
          Criar conta grátis
        </AuthSubmit>
      </form>

      <AuthDivider />

      <GoogleButton onClick={handleGoogle} disabled={isPending} />
    </AuthCard>
  );
}
