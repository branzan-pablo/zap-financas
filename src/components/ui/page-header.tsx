import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Cabeçalho de tela: `h1` + uma frase que diz o que a tela faz.
 *
 * As 16 cópias deste bloco divergiam em espaçamento (mb-5 aqui, mb-6 ali) e
 * ordem de classes. O `h1` fica aqui dentro para garantir um — e só um — por
 * rota, que é o que leitor de tela e navegação por cabeçalho esperam.
 */
export function PageHeader({
  titulo,
  descricao,
  acao,
  voltar,
  className,
}: {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  /** Ação primária da tela, alinhada à direita. */
  acao?: React.ReactNode;
  /** Subpáginas: `{ href, label }` do nível acima. */
  voltar?: { href: string; label: string };
  className?: string;
}) {
  return (
    // Sempre em linha, inclusive no mobile: a ação da tela some se rolar para
    // baixo do texto, e nas telas que a têm ela é o motivo de estar ali.
    <div
      className={cn("mb-6 flex items-start justify-between gap-4", className)}
    >
      <div className="min-w-0">
        {voltar && (
          <Link
            href={voltar.href}
            className="text-sm text-slate transition-colors hover:text-ink"
          >
            ← {voltar.label}
          </Link>
        )}
        <h1
          className={cn(
            "font-display text-2xl font-bold text-ink",
            voltar && "mt-2"
          )}
        >
          {titulo}
        </h1>
        {descricao && <p className="mt-1 text-slate">{descricao}</p>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}
