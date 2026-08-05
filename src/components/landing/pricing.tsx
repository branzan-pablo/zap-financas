"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PeriodKey = "mensal" | "trimestral" | "anual";

const PLANS: Record<
  PeriodKey,
  {
    label: string;
    price: string;
    period: string;
    per?: string;
    save?: string;
    popular?: boolean;
  }
> = {
  mensal: {
    label: "Mensal",
    price: "R$ 19,90",
    period: "/mês",
    per: "cobrado todo mês",
  },
  trimestral: {
    label: "Trimestral",
    price: "R$ 49,90",
    period: "/trimestre",
    per: "≈ R$ 16,63/mês",
    save: "16%",
  },
  anual: {
    label: "Anual",
    price: "R$ 149,90",
    period: "/ano",
    per: "≈ R$ 12,49/mês",
    save: "37%",
    popular: true,
  },
};

const FEATURES = [
  "Cartões ilimitados",
  "Fatura projetada em tempo real",
  "Mapa de parcelas futuras",
  "Alertas antes do fechamento",
  "Captura de compras pelo WhatsApp",
];

const ORDER: PeriodKey[] = ["mensal", "trimestral", "anual"];

export function Pricing() {
  const [period, setPeriod] = useState<PeriodKey>("anual");
  const plan = PLANS[period];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-lg text-center">
        <span className="font-num text-xs font-medium uppercase tracking-[0.18em] text-emerald">
          Acesso antecipado
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-ink sm:text-[2.5rem] sm:leading-[1.1]">
          Vagas de fundador
        </h2>
        <p className="mt-4 leading-relaxed text-slate">
          Quem entra primeiro trava o preço de fundador pra sempre. Escolha como
          quer pagar.
        </p>
      </div>

      {/* Toggle de período */}
      <div className="mx-auto mt-8 flex w-full max-w-md rounded-full border border-line bg-white p-1">
        {ORDER.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={cn(
              "relative flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
              period === key
                ? "bg-ink text-white"
                : "text-slate hover:text-ink"
            )}
          >
            {PLANS[key].label}
            {PLANS[key].save && (
              <span
                className={cn(
                  "ml-1 font-num text-[11px]",
                  period === key ? "text-emerald-bright" : "text-emerald"
                )}
              >
                -{PLANS[key].save}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-2xl border border-emerald/30 bg-white shadow-[0_1px_2px_rgba(11,18,32,.05),0_16px_40px_rgba(11,18,32,.07)]">
        <div className="flex items-center justify-between border-b border-line bg-emerald-soft/60 px-8 py-3">
          <span className="font-num text-xs uppercase tracking-[0.18em] text-emerald-ink">
            Plano Fundador
          </span>
          <span className="font-num text-xs text-emerald-ink">
            {plan.popular ? "mais popular" : "primeiras 100 vagas"}
          </span>
        </div>
        <div className="p-8">
          <div className="flex items-end gap-2">
            <span className="font-num text-5xl font-bold tracking-tight text-ink">
              {plan.price}
            </span>
            <span className="mb-1.5 text-slate">{plan.period}</span>
          </div>
          {plan.per && (
            <p className="mt-2 font-num text-sm text-slate">{plan.per}</p>
          )}

          <ul className="mt-7 space-y-3">
            {FEATURES.map((item) => (
              <li key={item} className="flex items-center gap-3 text-ink">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-soft text-xs text-emerald">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {/* O plano é escolhido dentro do app, depois do trial — aqui a ação
                é uma só: criar a conta. Um CTA por cartão evitaria decisão
                antes de a pessoa conhecer o produto. */}
            <Button
              size="lg"
              className="w-full font-semibold"
              render={<Link href="/signup" />}
            >
              Começar grátis
            </Button>
            <p className="mt-3 text-center text-sm text-slate">
              14 dias grátis. Você só escolhe o plano depois.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 font-num text-xs text-slate">
              <span className="rounded-full border border-line px-2.5 py-1">
                Pix
              </span>
              <span className="rounded-full border border-line px-2.5 py-1">
                Cartão em até 12x
              </span>
              <span className="rounded-full border border-line px-2.5 py-1">
                Garantia de 7 dias
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
