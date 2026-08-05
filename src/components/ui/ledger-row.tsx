import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Linha de razão: rótulo · pontilhado · valor.
 *
 * O vernáculo do extrato bancário. O pontilhado é decoração pura (`aria-hidden`):
 * quem ouve a tela ouve "Por dia até o fim do mês, R$ 82,40" — sem os pontinhos.
 */
export function LedgerRow({
  rotulo,
  valor,
  className,
}: {
  rotulo: React.ReactNode;
  valor: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline text-sm text-ink/70", className)}>
      <span className="min-w-0">{rotulo}</span>
      <span className="ledger-leader" aria-hidden />
      <span className="font-num font-semibold text-ink">{valor}</span>
    </div>
  );
}
