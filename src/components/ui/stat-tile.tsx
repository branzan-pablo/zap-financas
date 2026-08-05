import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { cardVariants } from "./card";
import { TONE, type Tone } from "./tone";

/**
 * Bloco de número: rótulo pequeno em cima, valor em dígitos tabulares embaixo.
 *
 * Com `href`, o cartão inteiro é o link — não um `<div onClick>`: navegação
 * precisa sobreviver a Cmd+clique, clique do meio e "abrir em nova aba". É
 * também a maior área de toque possível para o dedo.
 */
export function StatTile({
  titulo,
  valor,
  detalhe,
  href,
  size = "sm",
  tone = "neutro",
  className,
}: {
  titulo: React.ReactNode;
  valor: React.ReactNode;
  /** Linha de apoio abaixo do valor (truncada — pode vir longa do banco). */
  detalhe?: React.ReactNode;
  href?: string;
  /** `sm` = grade de resumo; `md` = cartão de destaque. */
  size?: "sm" | "md";
  /** Colore a superfície quando o número em si é um alerta. */
  tone?: Tone;
  className?: string;
}) {
  const classes = cn(
    cardVariants({ padding: size === "sm" ? "sm" : "md" }),
    TONE[tone].fundo,
    TONE[tone].borda,
    href && "block transition-shadow hover:shadow-[0_4px_12px_rgba(11,18,32,.06)]",
    className
  );

  const conteudo = (
    <>
      <p className={cn("text-slate", size === "sm" ? "text-xs" : "text-sm")}>
        {titulo}
      </p>
      <p
        className={cn(
          "mt-1 font-num font-bold text-ink",
          size === "sm" ? "text-lg" : "text-xl"
        )}
      >
        {valor}
      </p>
      {detalhe && <p className="mt-1 truncate text-xs text-slate">{detalhe}</p>}
    </>
  );

  return href ? (
    <Link href={href} className={classes}>
      {conteudo}
    </Link>
  ) : (
    <div className={classes}>{conteudo}</div>
  );
}
