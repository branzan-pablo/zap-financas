import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { trialDaysRemaining } from "@/lib/trial";
import { formatBRL } from "@/lib/format";
import { gerarAlertas, type Severidade } from "@/lib/alerts";
import { NIVEL_LABEL, type NivelSaude } from "@/lib/health-score";
import { carregarStreak } from "@/lib/streak-data";
import { resumoFinanceiro } from "@/lib/finance-summary";

const SCORE_UI: Record<NivelSaude, { cor: string; bg: string; barra: string }> = {
  excelente: { cor: "text-emerald", bg: "bg-emerald-soft", barra: "bg-emerald" },
  bom: { cor: "text-emerald", bg: "bg-emerald-soft", barra: "bg-emerald" },
  atencao: { cor: "text-[#9a6a00]", bg: "bg-amber-soft", barra: "bg-[#d99a00]" },
  critico: { cor: "text-red-600", bg: "bg-red-50", barra: "bg-red-500" },
};

const STATUS_UI = {
  folga: { cor: "text-emerald", bg: "bg-emerald-soft", label: "No azul" },
  atencao: { cor: "text-[#9a6a00]", bg: "bg-amber-soft", label: "Atenção" },
  estouro: { cor: "text-red-600", bg: "bg-red-50", label: "No vermelho" },
} as const;

const ALERTA_UI: Record<Severidade, string> = {
  critico: "border-red-200 bg-red-50",
  atencao: "border-amber/40 bg-amber-soft",
  info: "border-line bg-white",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, plano, trial_ends_at")
    .eq("id", user!.id)
    .single();

  const nome = profile?.nome ?? user?.email?.split("@")[0] ?? "você";
  const trialDays = trialDaysRemaining(profile?.trial_ends_at ?? null);
  const onTrial = profile?.plano === "trial" && trialDays !== null && trialDays > 0;

  // --- Resumo financeiro consolidado (mesma fonte do job de alertas) --------
  const hoje = new Date();
  const [resumo, streak] = await Promise.all([
    resumoFinanceiro(supabase, user!.id, hoje),
    carregarStreak(supabase, user!.id, hoje),
  ]);

  if (resumo.numContas === 0) {
    return <ConectarVazio nome={nome} onTrial={onTrial} trialDays={trialDays} />;
  }

  const {
    saldoContas,
    totalInvestido,
    faturaTotal,
    gastoMes,
    assinaturas,
    custoAssinaturas,
    duplicatas,
    limite,
    faturas,
  } = resumo;
  const categorias = resumo.gastosPorCategoria.slice(0, 6);
  const maxCat = Math.max(1, ...categorias.map((c) => c.total));
  const ui = STATUS_UI[limite.status];

  // Alertas in-app derivados do estado.
  const alertas = gerarAlertas({
    faturas,
    limiteStatus: limite.status,
    limiteDisponivel: limite.disponivel,
    duplicatas,
    orcamentos: resumo.orcamentos,
    hoje,
    fmt: formatBRL,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Olá, {nome} 👋</h1>
        <p className="mt-1 text-slate">Sua visão geral de {mesLabel(hoje)}.</p>
      </div>

      {onTrial && <TrialBanner trialDays={trialDays!} />}

      {/* HERÓI: limite seguro do mês */}
      <div className={`mb-6 rounded-2xl border border-line ${ui.bg} p-6`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink/70">
            Você pode gastar com segurança
          </p>
          <span className={`rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-semibold ${ui.cor}`}>
            {ui.label}
          </span>
        </div>
        <p className={`mt-1 font-num text-4xl font-bold ${ui.cor}`}>
          {formatBRL(Math.max(0, limite.disponivel))}
        </p>
        <p className="mt-1 text-sm text-ink/70">
           {limite.status === "estouro"
            ? `Você já passou do previsto em ${formatBRL(-limite.disponivel)} este mês.`
            : `Cerca de ${formatBRL(limite.porDia)} por dia até o fim do mês.`}
        </p>
      </div>

      {/* Alertas in-app */}
      {alertas.length > 0 && (
        <div className="mb-6 space-y-2">
          {alertas.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl border p-3 ${ALERTA_UI[a.severidade]}`}
            >
              <span aria-hidden className="mt-0.5 text-base">
                {a.severidade === "critico" ? "⛔" : "⚠️"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{a.titulo}</p>
                <p className="text-sm text-slate">{a.detalhe}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Score de saúde financeira */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate">Saúde financeira</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className={`font-num text-4xl font-bold ${SCORE_UI[resumo.score.nivel].cor}`}>
                {resumo.score.score}
              </span>
              <span className="text-sm text-slate">/ 100</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SCORE_UI[resumo.score.nivel].bg} ${SCORE_UI[resumo.score.nivel].cor}`}
            >
              {NIVEL_LABEL[resumo.score.nivel]}
            </span>
            {/* Sequência de dias registrando — incentivo ao hábito. */}
            {streak.atual > 1 && (
              <span
                className="rounded-full bg-amber-soft px-2.5 py-0.5 text-xs font-semibold text-[#9a6a00]"
                title={
                  streak.recorde > streak.atual
                    ? `Seu recorde é de ${streak.recorde} dias`
                    : "Este é o seu recorde!"
                }
              >
                🔥 {streak.atual} dias seguidos
              </span>
            )}
          </div>
        </div>

        {/* Barra do score */}
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-paper"
          role="progressbar"
          aria-valuenow={resumo.score.score}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full ${SCORE_UI[resumo.score.nivel].barra}`}
            style={{ width: `${resumo.score.score}%` }}
          />
        </div>

        <ul className="mt-4 space-y-1.5">
          {resumo.score.componentes.map((c) => (
            <li key={c.chave} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-slate">{c.nome}</span>
              <span className="shrink-0 font-num text-ink">
                {Math.round(c.nota * c.peso)}
                <span className="text-slate">/{Math.round(c.peso)}</span>
              </span>
            </li>
          ))}
        </ul>

        {resumo.score.dicas.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">
              Para melhorar
            </p>
            <ul className="mt-1.5 space-y-1">
              {resumo.score.dicas.map((d, i) => (
                <li key={i} className="text-sm leading-relaxed text-ink">
                  • {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Resumo titulo="Em contas" valor={saldoContas} />
        <Resumo titulo="Fatura aberta" valor={faturaTotal} />
        <Resumo titulo="Investimentos" valor={totalInvestido} />
        <Resumo titulo="Gasto no mês" valor={gastoMes} />
      </div>

      {/* Gastos por categoria */}
      {categorias.length > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-4 font-display text-lg font-bold text-ink">
            Gastos por categoria
          </h2>
          <div className="space-y-3">
            {categorias.map((c) => (
              <div key={c.nome} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm text-ink">
                  {c.icone} {c.nome}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(c.total / maxCat) * 100}%`,
                      backgroundColor: c.cor ?? "#10b981",
                    }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right font-num text-sm font-semibold text-ink">
                  {formatBRL(c.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/transacoes"
          className="rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-[0_4px_12px_rgba(11,18,32,.06)]"
        >
          <p className="text-sm text-slate">Assinaturas detectadas</p>
          <p className="mt-1 font-num text-xl font-bold text-ink">
            {assinaturas.length}{" "}
            <span className="text-sm font-medium text-slate">
              · {formatBRL(custoAssinaturas)}/mês
            </span>
          </p>
          {assinaturas.length > 0 && (
            <p className="mt-1 truncate text-xs text-slate">
              {assinaturas.slice(0, 3).map((a) => a.descricao).join(", ")}
            </p>
          )}
        </Link>

        <div
          className={`rounded-2xl border p-5 ${
            duplicatas.length > 0
              ? "border-amber/40 bg-amber-soft"
              : "border-line bg-white"
          }`}
        >
          <p className="text-sm text-slate">Cobranças duplicadas</p>
          <p className="mt-1 font-num text-xl font-bold text-ink">
            {duplicatas.length}
          </p>
          <p className="mt-1 text-xs text-slate">
            {duplicatas.length > 0
              ? `Possível duplicidade: ${duplicatas[0].descricao} (${formatBRL(duplicatas[0].valor)})`
              : "Nenhuma cobrança suspeita encontrada."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs text-slate">{titulo}</p>
      <p className="mt-1 font-num text-lg font-bold text-ink">{formatBRL(valor)}</p>
    </div>
  );
}

function TrialBanner({ trialDays }: { trialDays: number }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald/30 bg-emerald-soft px-5 py-4">
      <p className="text-sm font-medium text-[#0a6e44]">
        Trial grátis — <span className="font-num font-bold">{trialDays}</span> dia
        {trialDays !== 1 ? "s" : ""} restante{trialDays !== 1 ? "s" : ""}
      </p>
      <Link
        href="/assinar"
        className="shrink-0 rounded-[10px] bg-emerald px-4 py-2 text-sm font-medium text-white hover:bg-emerald/90"
      >
        Assinar
      </Link>
    </div>
  );
}

function ConectarVazio({
  nome,
  onTrial,
  trialDays,
}: {
  nome: string;
  onTrial: boolean;
  trialDays: number | null;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Olá, {nome} 👋</h1>
        <p className="mt-1 text-slate">
          Vamos conectar suas contas para começar.
        </p>
      </div>
      {onTrial && trialDays !== null && <TrialBanner trialDays={trialDays} />}
      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-soft text-2xl">
          🏦
        </div>
        <h2 className="font-display text-xl font-bold text-ink">Conecte seu banco</h2>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed text-slate">
          Conecte suas contas via Open Finance e veja saldo, fatura projetada,
          investimentos e seu limite seguro do mês em um só lugar.
        </p>
        <Link
          href="/contas"
          className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-emerald px-5 py-2.5 font-medium text-white hover:bg-emerald/90"
        >
          Conectar banco
        </Link>
      </div>
    </div>
  );
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
function mesLabel(d: Date): string {
  return `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}
