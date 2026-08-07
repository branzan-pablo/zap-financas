"use client";

import { useState, useTransition } from "react";
import { updatePassword } from "../actions";
import { validarSenhaNova } from "@/lib/auth/validacao";
import {
  AuthCard,
  AuthError,
  AuthField,
  AuthPasswordInput,
  AuthSubmit,
  AuthTitle,
  RequisitosSenha,
} from "@/components/auth/auth-shell";

type Erros = Partial<Record<"password" | "confirm", string>>;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [erro, setErro] = useState<string | null>(null);
  const [tentou, setTentou] = useState(false);
  const [pendente, iniciar] = useTransition();

  function conferir(senha: string, repetida: string): Erros {
    return {
      password: validarSenhaNova(senha) ?? undefined,
      // Só cobramos a confirmação depois que ela tem conteúdo: acusar
      // "não coincidem" na primeira letra da repetição é acusar o óbvio.
      confirm:
        repetida && repetida !== senha ? "As senhas não coincidem." : undefined,
    };
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTentou(true);
    setErro(null);

    const achados = conferir(password, confirm);
    if (!confirm) achados.confirm = "Repita a senha.";
    setErros(achados);

    const primeiro = (["password", "confirm"] as const).find((c) => achados[c]);
    if (primeiro) {
      document.getElementById(primeiro)?.focus();
      return;
    }

    const fd = new FormData();
    fd.set("password", password);
    iniciar(async () => {
      const resultado = await updatePassword(fd);
      if (resultado?.error) setErro(resultado.error);
    });
  }

  function mudar(campo: "password" | "confirm", valor: string) {
    const senha = campo === "password" ? valor : password;
    const repetida = campo === "confirm" ? valor : confirm;
    if (campo === "password") setPassword(valor);
    else setConfirm(valor);
    if (tentou) setErros(conferir(senha, repetida));
  }

  const senhaEmBranco = password.length === 0;

  return (
    <AuthCard>
      <AuthTitle>Nova senha</AuthTitle>
      <p className="mt-1 text-sm text-slate">
        Escolha uma senha que você não use em outro serviço.
      </p>

      {erro && <AuthError>{erro}</AuthError>}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <AuthField
          id="password"
          label="Nova senha"
          erro={senhaEmBranco ? erros.password : undefined}
          descricao={
            !senhaEmBranco && (
              <RequisitosSenha
                id="password-requisitos"
                senha={password}
                cobrando={tentou}
              />
            )
          }
        >
          <AuthPasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => mudar("password", e.target.value)}
            aria-invalid={Boolean(erros.password)}
            aria-describedby={
              senhaEmBranco
                ? erros.password
                  ? "password-erro"
                  : undefined
                : "password-requisitos"
            }
            disabled={pendente}
          />
        </AuthField>

        <AuthField id="confirm" label="Repita a senha" erro={erros.confirm}>
          <AuthPasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => mudar("confirm", e.target.value)}
            aria-invalid={Boolean(erros.confirm)}
            aria-describedby={erros.confirm ? "confirm-erro" : undefined}
            disabled={pendente}
          />
        </AuthField>

        <AuthSubmit pending={pendente} pendingLabel="Salvando…" className="mt-6">
          Salvar nova senha
        </AuthSubmit>
      </form>
    </AuthCard>
  );
}
