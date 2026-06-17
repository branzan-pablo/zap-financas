// Signature visual: projected invoice + future-installments timeline + chat bubble.
// Pure CSS animation (no client JS); respects prefers-reduced-motion via globals.css.

const PARCELAS = [
  { mes: "jun", valor: "1.240", width: "100%" },
  { mes: "jul", valor: "1.180", width: "95%" },
  { mes: "ago", valor: "980", width: "79%" },
  { mes: "set", valor: "760", width: "61%" },
  { mes: "out", valor: "450", width: "36%" },
  { mes: "nov", valor: "300", width: "24%" },
];

export function FaturaSignature() {
  return (
    <div className="relative w-full max-w-md">
      {/* Projected invoice card */}
      <div className="cz-rise rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(11,18,32,.06),0_8px_24px_rgba(11,18,32,.06)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate">
            Fatura projetada
          </span>
          <span className="rounded-full bg-amber-soft px-2.5 py-1 text-xs font-medium text-[#b4540a]">
            fecha em 4 dias
          </span>
        </div>

        <div className="mt-3 flex items-end gap-3">
          <span className="font-num text-4xl font-bold tracking-tight text-ink">
            R$&nbsp;2.180
          </span>
          <span className="font-num mb-1 text-sm font-medium text-amber">
            +R$&nbsp;190 ↑
          </span>
        </div>
        <p className="mt-1 text-sm text-slate">vs. R$ 1.990 no mês passado</p>

        {/* Installments timeline */}
        <div className="mt-6">
          <span className="text-xs font-medium uppercase tracking-wide text-slate">
            Já comprometido nos próximos meses
          </span>
          <div className="mt-3 space-y-2">
            {PARCELAS.map((p, i) => (
              <div key={p.mes} className="flex items-center gap-3">
                <span className="w-8 font-num text-xs text-slate">{p.mes}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f3f3ef]">
                  <div
                    className="cz-bar h-full rounded-full bg-emerald-bright"
                    style={{
                      width: p.width,
                      animationDelay: `${0.3 + i * 0.08}s`,
                    }}
                  />
                </div>
                <span className="w-14 text-right font-num text-xs text-ink">
                  {p.valor}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
