export default function TransacoesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Transações</h1>
        <p className="mt-1 text-slate">
          Histórico e categorização de todas as suas movimentações.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-soft text-2xl">
          ↕
        </div>
        <h2 className="font-display text-xl font-bold text-ink">
          Nenhuma transação ainda
        </h2>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed text-slate">
          Suas transações aparecerão aqui após conectar um banco via Open
          Finance. Categorização automática com IA incluída.
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-soft px-4 py-1.5 text-sm font-medium text-[#0a6e44]">
          Em desenvolvimento — Fase 1
        </span>
      </div>
    </div>
  );
}
