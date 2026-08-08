"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resetPassword } from "../actions";
import { validarEmail } from "@/lib/auth/validacao";
import {
  AuthCard,
  AuthError,
  AuthField,
  AuthInput,
  AuthSubmit,
  AuthSuccess,
  AuthTitle,
} from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentou, setTentou] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [pendente, iniciar] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTentou(true);
    setErro(null);

    const invalido = validarEmail(email);
    setErroEmail(invalido);
    if (invalido) {
      document.getElementById("email")?.focus();
      return;
    }

    const fd = new FormData();
    fd.set("email", email.trim());
    iniciar(async () => {
      const resultado = await resetPassword(fd);
      if (resultado?.error) {
        setErro(resultado.error);
      } else {
        setEnviado(true);
      }
    });
  }

  if (enviado) {
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
        Digite seu e-mail e enviaremos um link para criar uma nova senha.
      </p>

      {erro && <AuthError>{erro}</AuthError>}

      {/* `noValidate`: a validação é nossa, em português e presa ao campo — o
          balão nativo do navegador some sozinho e não é lido por leitor de tela. */}
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <AuthField id="email" label="E-mail" erro={erroEmail ?? undefined}>
          <AuthInput
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (tentou) setErroEmail(validarEmail(e.target.value));
            }}
            aria-invalid={Boolean(erroEmail)}
            aria-describedby={erroEmail ? "email-erro" : undefined}
            disabled={pendente}
          />
        </AuthField>

        <AuthSubmit pending={pendente} pendingLabel="Enviando…" className="mt-6">
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
