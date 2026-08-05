"use client";

import { useState, useTransition } from "react";
import { updatePassword } from "../actions";
import {
  AuthCard,
  AuthError,
  AuthInput,
  AuthLabel,
  AuthSubmit,
  AuthTitle,
} from "@/components/auth/auth-shell";

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
    <AuthCard>
      <AuthTitle>Nova senha</AuthTitle>
      <p className="mt-1 text-sm text-slate">
        Escolha uma senha segura com pelo menos 8 caracteres.
      </p>

      {error && <AuthError>{error}</AuthError>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <AuthLabel htmlFor="password">Nova senha</AuthLabel>
          <AuthInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={isPending}
          />
        </div>

        <div>
          <AuthLabel htmlFor="confirm">Confirmar senha</AuthLabel>
          <AuthInput
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={isPending}
          />
        </div>

        <AuthSubmit pending={isPending} pendingLabel="Salvando…">
          Salvar nova senha
        </AuthSubmit>
      </form>
    </AuthCard>
  );
}
