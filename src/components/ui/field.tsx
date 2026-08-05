import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Rótulo + controle + apoio/erro.
 *
 * O `htmlFor` é obrigatório na assinatura porque um rótulo que não está ligado
 * ao controle é enfeite: não aumenta a área de clique nem é anunciado junto do
 * campo. Passar o mesmo `id` no controle é responsabilidade de quem usa.
 */
export function Field({
  id,
  label,
  hint,
  erro,
  className,
  children,
}: {
  /** Precisa bater com o `id` do controle filho. */
  id: string;
  label: React.ReactNode;
  /** Texto de apoio abaixo do campo. */
  hint?: React.ReactNode;
  /** Mensagem de erro — substitui o hint e é anunciada quando aparece. */
  erro?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {(erro || hint) && (
        <p
          id={`${id}-hint`}
          aria-live={erro ? "polite" : undefined}
          className={cn("mt-1.5 text-sm", erro ? "text-danger" : "text-slate")}
        >
          {erro ?? hint}
        </p>
      )}
    </div>
  );
}
