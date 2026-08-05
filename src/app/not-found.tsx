import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Página não encontrada · Zap Finanças",
  robots: { index: false },
};

/**
 * 404. O `app/not-found.tsx` da raiz atende tanto o `notFound()` explícito
 * quanto qualquer URL que não casa com rota nenhuma do app.
 */
export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-paper px-4">
      <Card padding="none" elevated className="w-full max-w-sm p-8 text-center">
        <p
          aria-hidden
          className="font-num text-5xl font-bold tracking-tight text-emerald"
        >
          404
        </p>
        <h1 className="mt-4 font-display text-xl font-bold text-ink">
          Esta página não existe
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          O endereço pode ter mudado de lugar — ou nunca esteve aqui.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="emerald" render={<Link href="/dashboard" />}>
            Ir para o app
          </Button>
          <Button variant="outline" render={<Link href="/" />}>
            Página inicial
          </Button>
        </div>
      </Card>
    </main>
  );
}
