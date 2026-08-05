import * as React from "react";

import { cn } from "@/lib/utils";
import { Card } from "./card";
import { TONE, type Tone } from "./tone";

/**
 * Estado vazio: cartão tracejado, bolha com o ícone, uma frase e (às vezes) a
 * ação que resolve o vazio.
 *
 * Tracejado porque a borda pontilhada é o vernáculo de "aqui cabe algo que ainda
 * não existe" — diferente da borda sólida, que delimita conteúdo real.
 */
export function EmptyState({
  icone,
  titulo,
  descricao,
  acao,
  size = "md",
  tone = "ok",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  /** Emoji ou ícone. Decorativo — o texto já carrega o significado. */
  icone?: React.ReactNode;
  titulo?: React.ReactNode;
  descricao: React.ReactNode;
  acao?: React.ReactNode;
  /** `md` = tela inteira vazia; `sm` = bloco vazio dentro de uma tela cheia. */
  size?: "sm" | "md";
  /**
   * Cor da bolha do ícone. Vazio é um estado neutro/positivo (verde), mas o
   * mesmo componente serve de tela de erro — e ali o verde mente.
   */
  tone?: Tone;
}) {
  const grande = size === "md";
  return (
    <Card
      dashed
      padding={grande ? "none" : "lg"}
      className={cn("text-center", grande && "p-10", className)}
      {...props}
    >
      {icone && (
        <div
          aria-hidden
          className={cn(
            "mx-auto grid place-items-center rounded-full",
            TONE[tone].fundo,
            grande ? "mb-4 size-14 text-2xl" : "mb-3 size-12 text-xl"
          )}
        >
          {icone}
        </div>
      )}
      {/* `h2` de verdade: o estado vazio é a única coisa na tela, e quem navega
          por cabeçalhos precisa encontrá-lo abaixo do `h1` da página. */}
      {titulo && (
        <h2
          className={cn(
            "font-display font-bold text-ink",
            grande ? "text-xl" : "text-lg"
          )}
        >
          {titulo}
        </h2>
      )}
      <p
        className={cn(
          "mx-auto max-w-sm leading-relaxed text-slate",
          titulo ? "mt-2" : "",
          grande ? "" : "text-sm"
        )}
      >
        {descricao}
      </p>
      {acao && <div className="mt-6">{acao}</div>}
    </Card>
  );
}
