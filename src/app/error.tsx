"use client"; // Limites de erro precisam ser Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Erro nas telas públicas (landing, auth, assinatura, checkout).
 *
 * Fica fora do shell autenticado, então se apresenta sozinho e centralizado.
 * O `(app)/error.tsx` cobre o app logado; este pega o resto.
 */
export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-svh place-items-center bg-paper px-4">
      <Card padding="none" elevated className="w-full max-w-sm p-8 text-center">
        <div
          aria-hidden
          className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-amber-soft text-2xl"
        >
          ⚠️
        </div>
        <h1 className="font-display text-xl font-bold text-ink">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Tivemos um problema para carregar esta página. Tente de novo em
          instantes.
        </p>
        {error.digest && (
          <p className="mt-3 font-num text-xs text-slate">
            Código do erro: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="emerald" onClick={() => unstable_retry()}>
            Tentar de novo
          </Button>
          <Button variant="outline" render={<Link href="/" />}>
            Ir para o início
          </Button>
        </div>
      </Card>
    </main>
  );
}
