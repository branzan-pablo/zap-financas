"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, signInWithGoogle } from "../actions";
import { cn } from "@/lib/utils";

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
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_1px_2px_rgba(11,18,32,.06),0_8px_24px_rgba(11,18,32,.06)]">
        <h1 className="font-display text-2xl font-bold text-ink">Entrar</h1>
        <p className="mt-1 text-sm text-slate">
          Ainda não tem conta?{" "}
          <Link href="/signup" className="text-emerald hover:underline">
            Criar conta
          </Link>
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-amber/30 bg-amber-soft px-4 py-3 text-sm text-ink">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={cn(
                "mt-1.5 w-full rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-ink placeholder:text-slate/60",
                "focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20",
                "disabled:opacity-50"
              )}
              placeholder="seu@email.com"
              disabled={isPending}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink"
              >
                Senha
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-slate hover:text-ink"
              >
                Esqueceu?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={cn(
                "mt-1.5 w-full rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-ink",
                "focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20",
                "disabled:opacity-50"
              )}
              disabled={isPending}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "mt-2 w-full rounded-[10px] bg-emerald px-4 py-2.5 font-medium text-white",
              "hover:bg-emerald/90 focus:outline-none focus:ring-2 focus:ring-emerald/30",
              "disabled:opacity-60 transition-colors"
            )}
          >
            {isPending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-xs text-slate">ou</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={isPending}
          className={cn(
            "flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink",
            "hover:bg-paper focus:outline-none focus:ring-2 focus:ring-emerald/20",
            "disabled:opacity-60 transition-colors"
          )}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path
              d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
              fill="#EA4335"
            />
          </svg>
          Continuar com Google
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm animate-pulse rounded-2xl border border-line bg-white p-8 h-96" />}>
      <LoginForm />
    </Suspense>
  );
}
