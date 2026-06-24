"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resetPassword } from "../actions";
import { cn } from "@/lib/utils";

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
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-[0_1px_2px_rgba(11,18,32,.06),0_8px_24px_rgba(11,18,32,.06)]">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-emerald-soft text-2xl">
            ✉️
          </div>
          <h2 className="font-display text-xl font-bold text-ink">
            Email enviado
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            Se esse email estiver cadastrado, você receberá um link para
            redefinir sua senha em instantes.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm text-emerald hover:underline"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_1px_2px_rgba(11,18,32,.06),0_8px_24px_rgba(11,18,32,.06)]">
        <h1 className="font-display text-2xl font-bold text-ink">
          Recuperar senha
        </h1>
        <p className="mt-1 text-sm text-slate">
          Digite seu email e enviaremos um link para criar uma nova senha.
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

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "w-full rounded-[10px] bg-emerald px-4 py-2.5 font-medium text-white",
              "hover:bg-emerald/90 focus:outline-none focus:ring-2 focus:ring-emerald/30",
              "disabled:opacity-60 transition-colors"
            )}
          >
            {isPending ? "Enviando…" : "Enviar link"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-slate hover:text-ink">
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
