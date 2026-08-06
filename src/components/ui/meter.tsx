import * as React from "react";

import { cn } from "@/lib/utils";
import { TONE, type Tone } from "./tone";

/**
 * Barra de progresso.
 *
 * Existiam 6 escritas à mão e só 2 declaravam `role="progressbar"` — para um
 * leitor de tela, as outras 4 eram duas `div`s vazias. Aqui a semântica vem
 * junto com o pixel: não dá para desenhar a barra sem anunciá-la.
 */
export function Meter({
  valor,
  max = 100,
  tone = "ok",
  cor,
  label,
  animar = false,
  atraso = 0,
  className,
}: {
  valor: number;
  max?: number;
  tone?: Tone;
  /** Cor vinda do banco (categorias). Quando presente, ignora o `tone`. */
  cor?: string | null;
  /** Rótulo para leitor de tela quando a barra não tem texto adjacente. */
  label?: string;
  /**
   * Preenche a barra da esquerda para a direita ao pintar, reusando o `cz-bar`
   * da assinatura visual. É CSS puro: o componente continua server, sem
   * hidratação, e `prefers-reduced-motion` já é respeitado em globals.css.
   */
  animar?: boolean;
  /** Segundos de atraso — escalona uma lista de barras (só com `animar`). */
  atraso?: number;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (valor / max) * 100)) : 0;
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-paper", className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full", animar && "cz-bar", !cor && TONE[tone].barra)}
        style={{
          width: `${pct}%`,
          backgroundColor: cor ?? undefined,
          animationDelay: animar && atraso ? `${atraso}s` : undefined,
        }}
      />
    </div>
  );
}
