"use client"; // Limites de erro precisam ser Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

/**
 * Erro dentro do app autenticado.
 *
 * Renderiza no lugar da tela, com a sidebar e a bottom nav ainda de pé — quem
 * viu o erro consegue ir para outra seção sem recarregar nada.
 *
 * `unstable_retry` (Next 16.2) refaz a busca de dados e re-renderiza o segmento,
 * diferente do `reset`, que só limpa o estado do boundary. Como a causa mais
 * provável aqui é uma consulta que falhou — rede, Supabase fora do ar —, tentar
 * de novo de verdade é o que resolve.
 */
export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Em produção a mensagem vem genérica; o `digest` é o que casa com o log
    // do servidor. Por isso ele aparece na tela: é o número que o suporte pede.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        titulo="Algo deu errado"
        descricao="Não conseguimos carregar esta tela. Seus dados estão a salvo — foi a leitura que falhou, não o registro."
      />
      <EmptyState
        tone="atencao"
        icone="⚠️"
        titulo="Tente de novo"
        descricao={
          <>
            Se o erro insistir, dê uma olhada em{" "}
            <Link href="/contas" className="font-medium text-emerald underline">
              Contas
            </Link>{" "}
            para conferir se alguma conexão com o banco expirou.
            {error.digest && (
              <>
                <br />
                <span className="mt-2 inline-block font-num text-xs text-slate">
                  Código do erro: {error.digest}
                </span>
              </>
            )}
          </>
        }
        acao={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="emerald" onClick={() => unstable_retry()}>
              Tentar de novo
            </Button>
            <Button variant="outline" render={<Link href="/dashboard" />}>
              Voltar ao início
            </Button>
          </div>
        }
      />
    </div>
  );
}
