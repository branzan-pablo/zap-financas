import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carregamento das telas autenticadas.
 *
 * Vale para a navegação entre seções do app: a sidebar e a bottom nav já estão
 * montadas e seguem clicáveis, e só a área de conteúdo troca por este esqueleto.
 * Na PRIMEIRA carga ele não aparece — o `layout.tsx` acima faz a checagem de
 * sessão e o gate de assinatura, que precisam bloquear porque podem redirecionar
 * (ver a ressalva sobre dados de runtime em layout na doc do `loading.js`).
 *
 * A forma é a média das telas do app: um cabeçalho, um bloco alto de destaque e
 * uma lista. Genérico de propósito — um esqueleto que imita o dashboard exato
 * mentiria nas outras oito rotas.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando…</span>

      {/* Cabeçalho */}
      <div className="mb-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>

      {/* Bloco de destaque */}
      <Card padding="hero" className="mb-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-12 w-56" />
        <Skeleton className="mt-4 h-4 w-full" />
      </Card>

      {/* Lista */}
      <Card padding="none" className="overflow-hidden">
        <ul className="divide-y divide-line">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-1.5 h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-20 shrink-0" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
