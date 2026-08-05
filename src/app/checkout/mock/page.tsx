import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBRL } from "@/lib/format";
import { getPlano } from "@/lib/payments/plans";
import { confirmarPagamento } from "./actions";

export default async function CheckoutMockPage({
  searchParams,
}: {
  searchParams: Promise<{ ext?: string; plano?: string }>;
}) {
  const { ext, plano: planoId } = await searchParams;
  const plano = getPlano(planoId ?? "");
  if (!plano || !ext) redirect("/assinar");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="grid min-h-svh place-items-center bg-paper px-4">
      <Card padding="lg" className="w-full max-w-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[#009ee3] text-xs font-bold text-white">
            MP
          </span>
          <p className="text-sm text-slate">Checkout (ambiente de simulação)</p>
        </div>

        <p className="font-display text-lg font-bold text-ink">
          Plano {plano.nome}
        </p>
        <p className="mt-1">
          <span className="font-num text-2xl font-bold text-ink">
            {formatBRL(plano.preco)}
          </span>
          <span className="text-sm text-slate">{plano.periodoLabel}</span>
        </p>

        <div className="mt-5 space-y-2">
          <form action={confirmarPagamento}>
            <input type="hidden" name="plano" value={plano.id} />
            <input type="hidden" name="ext" value={ext} />
            <Button type="submit" className="w-full">
              Pagar com Pix (simulado)
            </Button>
          </form>
          <form action={confirmarPagamento}>
            <input type="hidden" name="plano" value={plano.id} />
            <input type="hidden" name="ext" value={ext} />
            <Button type="submit" variant="outline" className="w-full">
              Pagar com cartão (simulado)
            </Button>
          </form>
        </div>

        <Link
          href="/assinar"
          className="mt-4 block text-center text-sm text-slate hover:text-ink"
        >
          Cancelar
        </Link>

        <p className="mt-4 text-center text-xs text-slate">
          Nenhuma cobrança real é feita. Substituído pelo Mercado Pago quando as
          credenciais forem configuradas.
        </p>
      </Card>
    </div>
  );
}
