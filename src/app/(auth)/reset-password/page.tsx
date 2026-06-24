"use client";

import { useState, useTransition } from "react";
import { updatePassword } from "../actions";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("confirm")) {
      setError("As senhas não coincidem.");
      return;
    }
    startTransition(async () => {
      const result = await updatePassword(fd);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_1px_2px_rgba(11,18,32,.06),0_8px_24px_rgba(11,18,32,.06)]">
        <h1 className="font-display text-2xl font-bold text-ink">
          Nova senha
        </h1>
        <p className="mt-1 text-sm text-slate">
          Escolha uma senha segura com pelo menos 8 caracteres.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-amber/30 bg-amber-soft px-4 py-3 text-sm text-ink">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Nova senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={cn(
                "mt-1.5 w-full rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-ink",
                "focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20",
                "disabled:opacity-50"
              )}
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-ink">
              Confirmar senha
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
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
              "w-full rounded-[10px] bg-emerald px-4 py-2.5 font-medium text-white",
              "hover:bg-emerald/90 focus:outline-none focus:ring-2 focus:ring-emerald/30",
              "disabled:opacity-60 transition-colors"
            )}
          >
            {isPending ? "Salvando…" : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
