"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, signInWithGoogle } from "../actions";
import {
  AuthCard,
  AuthCardSkeleton,
  AuthDivider,
  AuthError,
  AuthInput,
  AuthLabel,
  AuthSubmit,
  AuthTitle,
  GoogleButton,
} from "@/components/auth/auth-shell";

// Isolated component so useSearchParams() is inside Suspense (required by Next.js)
function LoginForm() {
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    callbackError === "auth_callback_failed"
      ? "Falha na autenticação. Tente novamente."
      : null
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signIn(fd);
      if (result?.error) setError(result.error);
    });
  }

  function handleGoogle() {
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AuthCard>
      <AuthTitle>Entrar</AuthTitle>
      <p className="mt-1 text-sm text-slate">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="text-emerald hover:underline">
          Criar conta
        </Link>
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

        <div>
          <div className="flex items-center justify-between">
            <AuthLabel htmlFor="password">Senha</AuthLabel>
            <Link
              href="/forgot-password"
              className="text-xs text-slate hover:text-ink"
            >
              Esqueceu?
            </Link>
          </div>
          <AuthInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
          />
        </div>

        <AuthSubmit pending={isPending} pendingLabel="Entrando…" className="mt-2">
          Entrar
        </AuthSubmit>
      </form>

      <AuthDivider />

      <GoogleButton onClick={handleGoogle} disabled={isPending} />
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<AuthCardSkeleton />}
    >
      <LoginForm />
    </Suspense>
  );
}
