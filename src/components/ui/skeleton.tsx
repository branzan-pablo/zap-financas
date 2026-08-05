import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Bloco cinza que ocupa o lugar de um conteúdo que ainda está vindo.
 *
 * A regra aqui é ter a MESMA geometria do conteúdo real — mesma altura, mesma
 * largura, mesmo raio. Um esqueleto de tamanho diferente faz a tela pular
 * quando o dado chega, o que é pior do que não ter esqueleto nenhum.
 *
 * `aria-hidden` porque quem usa leitor de tela já foi avisado pelo `aria-busy`
 * do contêiner: ouvir "carregando" doze vezes seguidas não ajuda ninguém.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-lg bg-line motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
}
