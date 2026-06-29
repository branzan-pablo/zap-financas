import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatBRL, formatData } from "@/lib/format";
import { PLANOS, precoMensalEquivalente } from "@/lib/payments/plans";
import { avaliarAcesso } from "@/lib/payments/access";
import { iniciarCheckout, cancelarMinhaAssinatura } from "./actions";

export default async function AssinarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("trial_ends_at").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("status, plano, periodo_fim")
      .maybeSingle(),
  ]);

  const acesso = avaliarAcesso({
    trialEndsAt: profile?.trial_ends_at ?? null,
    status: sub?.status ?? null,
    periodoFim: sub?.periodo_fim ?? null,
  });

  const assinado = acesso.motivo === "assinatura";

  return (
    <div className="min-h-svh bg-paper px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <Link href="/dashboard" className="text-sm text-slate hover:text-ink">
            ← Voltar ao app
          </Link>
          <h1 className="mt-3 font-display text-3xl font-bold text-ink">
            {assinado ? "Sua assinatura" : "Escolha seu plano"}
          </h1>
          <p className="mt-2 text-slate">
            {assinado
              ? "Gerencie seu plano do Zap Finanças."
              : acesso.motivo === "trial"
                ? `Seu trial termina em ${acesso.trialDiasRestantes} dia${acesso.trialDiasRestantes !== 1 ? "s" : ""}. Garanta o preço de fundador.`
                : "Seu acesso está bloqueado. Assine para continuar usando o Zap Finanças."}
          </p>
        </div>

        {assinado ? (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-6 text-center">
            <p className="text-sm text-slate">Plano atual</p>
            <p className="mt-1 font-display text-xl font-bold text-ink capitalize">
              {sub?.plano}
            </p>
            {sub?.periodo_fim && (
              <p className="mt-2 text-sm text-slate">
                {sub.status === "cancelado"
                  ? `Acesso até ${formatData(sub.periodo_fim)} (renovação cancelada).`
                  : `Renova em ${formatData(sub.periodo_fim)}.`}
              </p>
            )}
            {sub?.status !== "cancelado" && (
              <form action={cancelarMinhaAssinatura} className="mt-5">
                <Button variant="outline" size="sm" type="submit">
                  Cancelar assinatura
                </Button>
              </form>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANOS.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                  p.destaque ? "border-emerald ring-1 ring-emerald" : "border-line"
                }`}
              >
                {p.destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald px-3 py-0.5 text-xs font-semibold text-white">
                    Melhor valor
                  </span>
                )}
                <p className="font-display text-lg font-bold text-ink">{p.nome}</p>
                <p className="mt-2">
                  <span className="font-num text-3xl font-bold text-ink">
                    {formatBRL(p.preco)}
                  </span>
                  <span className="text-sm text-slate">{p.periodoLabel}</span>
                </p>
                {p.meses > 1 && (
                  <p className="mt-1 text-xs text-slate">
                    equivale a {formatBRL(precoMensalEquivalente(p))}/mês
                  </p>
                )}
                <form action={iniciarCheckout} className="mt-5">
                  <input type="hidden" name="plano" value={p.id} />
                  <Button
                    type="submit"
                    variant={p.destaque ? "default" : "outline"}
                    className="w-full"
                  >
                    Assinar
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate">
          Pix Automático ou cartão · renovação automática · cancele quando quiser ·
          preço de fundador travado.
        </p>
      </div>
    </div>
  );
}
