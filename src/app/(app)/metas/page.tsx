export default function MetasPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Metas</h1>
        <p className="mt-1 text-slate">
          Fundo de emergência, viagem, carro — acompanhe seu progresso.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-soft text-2xl">
          🎯
        </div>
        <h2 className="font-display text-xl font-bold text-ink">
          Nenhuma meta criada
        </h2>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed text-slate">
          Crie metas financeiras e acompanhe seu progresso. O assistente do
          WhatsApp também vai te alertar quando você estiver perto de bater.
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-soft px-4 py-1.5 text-sm font-medium text-[#0a6e44]">
          Em desenvolvimento — Fase 2
        </span>
      </div>
    </div>
  );
}
