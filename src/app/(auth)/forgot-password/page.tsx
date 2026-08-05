"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resetPassword } from "../actions";
import {
  AuthCard,
  AuthError,
  AuthInput,
  AuthLabel,
  AuthSubmit,
  AuthSuccess,
  AuthTitle,
} from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await resetPassword(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <AuthSuccess
        titulo="Email enviado"
        descricao="Se esse email estiver cadastrado, você receberá um link para redefinir sua senha em instantes."
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
      <AuthTitle>Recuperar senha</AuthTitle>
      <p className="mt-1 text-sm text-slate">
        Digite seu email e enviaremos um link para criar uma nova senha.
      </p>

      {error && <AuthError>{error}</AuthError>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        <AuthSubmit pending={isPending} pendingLabel="Enviando…">
          Enviar link
        </AuthSubmit>
      </form>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-sm text-slate hover:text-ink">
          ← Voltar para o login
        </Link>
      </div>
    </AuthCard>
  );
}
