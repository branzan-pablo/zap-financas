import * as React from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * Peças compartilhadas das quatro telas de autenticação.
 *
 * Login, cadastro, "esqueci a senha" e "nova senha" eram quatro cópias do mesmo
 * cartão elevado, do mesmo divisor "ou", do mesmo banner de erro e do mesmo
 * botão do Google com o SVG inteiro repetido — ~120 linhas de duplicata que
 * divergiam a cada retoque.
 */

/** O cartão que É a tela de auth. */
export function AuthCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-sm">
      <Card padding="none" elevated className={cn("p-8", className)}>
        {children}
      </Card>
    </div>
  );
}

/** Esqueleto do cartão enquanto o `Suspense` resolve. */
export function AuthCardSkeleton() {
  return (
    <div className="w-full max-w-sm">
      <Card padding="none" elevated className="h-96 animate-pulse p-8" />
    </div>
  );
}

/** Título da tela de auth — aqui o cartão é a página, então é sempre `h1`. */
export function AuthTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display text-2xl font-bold text-ink">{children}</h1>;
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="mt-4 rounded-lg border border-amber/30 bg-amber-soft px-4 py-3 text-sm text-ink"
    >
      {children}
    </div>
  );
}

/** Divisor "ou" entre o formulário e o login social. */
export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-line" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-2 text-xs text-slate">ou</span>
      </div>
    </div>
  );
}

/** Botão "Continuar com Google", com o logo oficial em cores. */
export function GoogleButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-(--tap) w-full items-center justify-center gap-2.5 rounded-[10px] border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink",
        "transition-colors hover:bg-paper disabled:opacity-60"
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
  );
}

/**
 * Botão de envio das telas de auth: largura total e rótulo que vira gerúndio
 * durante o envio ("Entrando…"), para a tela nunca parecer travada.
 */
export function AuthSubmit({
  pending,
  pendingLabel,
  className,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "min-h-(--tap) w-full rounded-[10px] bg-emerald px-4 py-2.5 font-medium text-white",
        "transition-colors hover:bg-emerald/90 disabled:opacity-60",
        className
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/**
 * Tela de "deu certo, olhe seu email" — igual no cadastro e na recuperação de
 * senha. `h1` porque, nesse estado, ela é a página inteira.
 */
export function AuthSuccess({
  icone = "✉️",
  titulo,
  descricao,
  children,
}: {
  icone?: React.ReactNode;
  titulo: React.ReactNode;
  descricao: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <AuthCard className="text-center">
      <div
        aria-hidden
        className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-emerald-soft text-2xl"
      >
        {icone}
      </div>
      <h1 className="font-display text-xl font-bold text-ink">{titulo}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate">{descricao}</p>
      {children}
    </AuthCard>
  );
}

/** Rótulo dos campos de auth — tinta, não cinza: aqui o campo é a tela. */
export function AuthLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-medium text-ink", className)}
    >
      {children}
    </label>
  );
}

/** Campo de auth: mesma geometria do `.field`, com o anel de foco da marca. */
export function AuthInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "mt-1.5 min-h-(--tap) w-full rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-slate/60",
        "focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20",
        "disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
