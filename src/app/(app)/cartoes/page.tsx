export default function CartoesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Cartões</h1>
        <p className="mt-1 text-slate">
          Fatura projetada, mapa de parcelas e limite seguro do mês.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-soft text-2xl">
          💳
        </div>
        <h2 className="font-display text-xl font-bold text-ink">
          Nenhum cartão conectado
        </h2>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed text-slate">
          Fatura projetada em tempo real e mapa de parcelas futuras após
          conectar seu cartão via Open Finance.
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-soft px-4 py-1.5 text-sm font-medium text-[#0a6e44]">
          Em desenvolvimento — Fase 2
        </span>
      </div>
    </div>
  );
}
