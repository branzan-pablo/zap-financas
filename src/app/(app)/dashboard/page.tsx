import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { trialDaysRemaining } from "@/lib/trial";
import { formatBRL } from "@/lib/format";
import { agruparAlertas, gerarAlertas, type Severidade } from "@/lib/alerts";
import { NIVEL_LABEL, type NivelSaude } from "@/lib/health-score";
import { carregarStreak } from "@/lib/streak-data";
import { resumoFinanceiro } from "@/lib/finance-summary";
import { Tour } from "@/components/app/tour";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LedgerRow } from "@/components/ui/ledger-row";
import { Meter } from "@/components/ui/meter";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { TONE, type Tone } from "@/components/ui/tone";

// Cada domínio traduz o seu vocabulário para o tom compartilhado (ver tone.ts).
// Antes, cada um trazia o próprio hex — e eles divergiam entre si.
const SCORE_TONE: Record<NivelSaude, Tone> = {
  excelente: "ok",
  bom: "ok",
  atencao: "atencao",
  critico: "estouro",
};

const LIMITE_TONE = {
  folga: { tone: "ok", label: "No azul" },
  atencao: { tone: "atencao", label: "Atenção" },
  estouro: { tone: "estouro", label: "No vermelho" },
} as const satisfies Record<string, { tone: Tone; label: string }>;

const ALERTA_TONE: Record<Severidade, Tone> = {
  critico: "estouro",
  atencao: "atencao",
  info: "neutro",
};

/**
 * A casca da dashboard: saudação, aviso de trial e o esqueleto do resto.
 *
 * Só depende do perfil (uma consulta por chave primária), então pinta na hora.
 * O resumo financeiro — que soma contas, faturas, parcelas, investimentos e
 * orçamentos — desce em streaming atrás do `Suspense`, porque é ele que custa.
 */
export default async function DashboardPage({
  searchParams,
}: {
  // Next.js 16: searchParams é assíncrono. `?tour=1` refaz a apresentação.
  searchParams: Promise<{ tour?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { count: numContas }, { tour }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nome, plano, trial_ends_at, onboarding_done_at")
      .eq("id", user!.id)
      .single(),
    // Contagem barata só para escolher o subtítulo certo: quem ainda não
    // conectou nada não deve ler "sua visão geral do mês". O resumo pesado, que
    // também sabe disso, chega depois — mas o cabeçalho não pode esperar por ele.
    supabase
      .from("accounts")
      .select("id", { count: "exact", head: true })
      .eq("ativo", true),
    searchParams,
  ]);

  const nome = profile?.nome ?? user?.email?.split("@")[0] ?? "você";
  const trialDays = trialDaysRemaining(profile?.trial_ends_at ?? null);
  const onTrial = profile?.plano === "trial" && trialDays !== null && trialDays > 0;
  const semContas = (numContas ?? 0) === 0;
  const hoje = new Date();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        titulo={`Olá, ${nome} 👋`}
        descricao={
          semContas
            ? "Vamos conectar suas contas para começar."
            : `Sua visão geral de ${mesLabel(hoje)}.`
        }
      />

      {onTrial && <TrialBanner trialDays={trialDays!} />}

      {/* O Tour vive DENTRO do boundary de propósito: ele monta, espera um frame
          e descarta os passos cujo alvo não está na tela. Montado antes do
          conteúdo chegar, descartaria todos e nunca abriria. */}
      <Suspense fallback={<ResumoSkeleton />}>
        <ResumoDashboard
          userId={user!.id}
          hoje={hoje}
          jaViuTour={profile?.onboarding_done_at != null}
          tourForcado={tour === "1"}
        />
      </Suspense>
    </div>
  );
}

/**
 * Espelho do que vem depois: o cupom "Posso gastar", o cartão de saúde e a
 * grade de quatro números. Mesmas alturas do conteúdo real, para a tela não
 * pular quando o dado chegar.
 */
function ResumoSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando seu resumo…</span>

      <Card padding="hero" className="mb-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-12 w-56" />
        <hr className="cupom-rule my-3" />
        <Skeleton className="h-4 w-full" />
      </Card>

      <Card padding="lg" className="mb-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-10 w-24" />
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} padding="sm">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-6 w-24" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Tudo que depende do resumo financeiro — a parte cara, servida em streaming. */
async function ResumoDashboard({
  userId,
  hoje,
  jaViuTour,
  tourForcado,
}: {
  userId: string;
  hoje: Date;
  jaViuTour: boolean;
  tourForcado: boolean;
}) {
  const supabase = await createClient();
  const [resumo, streak] = await Promise.all([
    resumoFinanceiro(supabase, userId, hoje),
    carregarStreak(supabase, userId, hoje),
  ]);

  if (resumo.numContas === 0) {
    return (
      <>
        <ConectarVazio />
        {/* O tour também roda aqui: é justamente esta a tela de quem acabou de
            se cadastrar. Os passos sem alvo nesta tela são descartados sozinhos. */}
        <Tour jaViu={jaViuTour} forcado={tourForcado} />
      </>
    );
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
  const ui = LIMITE_TONE[limite.status];
  const scoreTone = SCORE_TONE[resumo.score.nivel];

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
    <>
      {/* HERÓI: limite seguro do mês — a assinatura visual do produto.
          Tira de cupom fiscal: o número que responde "posso gastar?" ganha o
          formato do artefato que o app lê pela câmera. */}
      <Card
        data-tour="posso-gastar"
        tone={ui.tone}
        padding="hero"
        className="cupom mb-6"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium tracking-wide text-ink/70 uppercase">
            Posso gastar
          </p>
          <Badge tone={ui.tone} className="h-auto bg-white/70 py-1">
            {ui.label}
          </Badge>
        </div>
        <p
          className={`mt-2 font-num text-[2.75rem] leading-none font-bold sm:text-5xl ${TONE[ui.tone].texto}`}
        >
          {formatBRL(Math.max(0, limite.disponivel))}
        </p>
        {/* Rateio em linha de razão — o vernáculo do extrato. */}
        <hr className="cupom-rule my-3" />
        <LedgerRow
          rotulo={
            limite.status === "estouro"
              ? "Acima do previsto"
              : "Por dia até o fim do mês"
          }
          valor={
            limite.status === "estouro"
              ? formatBRL(-limite.disponivel)
              : formatBRL(limite.porDia)
          }
        />
      </Card>

      {/* Alertas in-app — agrupados por tipo: três cartões idênticos de
          "cobrança duplicada" empurravam os dados para fora da primeira tela. */}
      {alertas.length > 0 && (
        <div data-tour="alertas" className="mb-6 space-y-2">
          {agruparAlertas(alertas).map((a, i) => (
            <Card
              key={i}
              tone={ALERTA_TONE[a.severidade]}
              padding="none"
              className="flex items-start gap-3 rounded-xl p-3.5"
            >
              <span aria-hidden className="mt-0.5 text-base">
                {a.severidade === "critico" ? "⛔" : "⚠️"}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{a.titulo}</p>
                {a.itens ? (
                  <ul className="mt-1 space-y-0.5">
                    {a.itens.map((item, j) => (
                      <li key={j} className="text-sm text-slate">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate">{a.detalhe}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Score de saúde financeira */}
      <Card data-tour="score" padding="lg" className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate">Saúde financeira</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className={`font-num text-4xl font-bold ${TONE[scoreTone].texto}`}>
                {resumo.score.score}
              </span>
              <span className="text-sm text-slate">/ 100</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge tone={scoreTone}>{NIVEL_LABEL[resumo.score.nivel]}</Badge>
            {/* Sequência de dias registrando — incentivo ao hábito. */}
            {streak.atual > 1 && (
              <Badge
                tone="atencao"
                title={
                  streak.recorde > streak.atual
                    ? `Seu recorde é de ${streak.recorde} dias`
                    : "Este é o seu recorde!"
                }
              >
                🔥 {streak.atual} dias seguidos
              </Badge>
            )}
          </div>
        </div>

        <Meter
          className="mt-4"
          valor={resumo.score.score}
          tone={scoreTone}
          label="Saúde financeira"
          animar
        />

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
      </Card>

      {/* Resumo */}
      <div data-tour="resumo" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile titulo="Em contas" valor={formatBRL(saldoContas)} />
        <StatTile titulo="Fatura aberta" valor={formatBRL(faturaTotal)} />
        <StatTile titulo="Investimentos" valor={formatBRL(totalInvestido)} />
        <StatTile titulo="Gasto no mês" valor={formatBRL(gastoMes)} />
      </div>

      {/* Gastos por categoria */}
      {categorias.length > 0 && (
        <Card className="mb-6">
          <CardTitle className="mb-4">Gastos por categoria</CardTitle>
          <div className="space-y-3">
            {categorias.map((c, i) => (
              <div key={c.nome} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm text-ink">
                  {c.icone} {c.nome}
                </span>
                <Meter
                  className="flex-1"
                  valor={c.total}
                  max={maxCat}
                  cor={c.cor ?? "#10b981"}
                  label={`${c.nome}: ${formatBRL(c.total)}`}
                  animar
                  atraso={i * 0.06}
                />
                <span className="w-24 shrink-0 text-right font-num text-sm font-semibold text-ink">
                  {formatBRL(c.total)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Insights */}
      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile
          size="md"
          href="/transacoes"
          titulo="Assinaturas detectadas"
          valor={
            <>
              {assinaturas.length}{" "}
              <span className="text-sm font-medium text-slate">
                · {formatBRL(custoAssinaturas)}/mês
              </span>
            </>
          }
          detalhe={
            assinaturas.length > 0
              ? assinaturas.slice(0, 3).map((a) => a.descricao).join(", ")
              : undefined
          }
        />

        <StatTile
          size="md"
          tone={duplicatas.length > 0 ? "atencao" : "neutro"}
          titulo="Cobranças duplicadas"
          valor={duplicatas.length}
          detalhe={
            duplicatas.length > 0
              ? `Possível duplicidade: ${duplicatas[0].descricao} (${formatBRL(duplicatas[0].valor)})`
              : "Nenhuma cobrança suspeita encontrada."
          }
        />
      </div>

      <Tour jaViu={jaViuTour} forcado={tourForcado} />
    </>
  );
}

function TrialBanner({ trialDays }: { trialDays: number }) {
  return (
    <Card
      tone="ok"
      className="mb-6 flex items-center justify-between gap-4 px-5 py-4"
    >
      <p className="text-sm font-medium text-emerald-ink">
        Trial grátis — <span className="font-num font-bold">{trialDays}</span> dia
        {trialDays !== 1 ? "s" : ""} restante{trialDays !== 1 ? "s" : ""}
      </p>
      <Button variant="emerald" size="sm" render={<Link href="/assinar" />}>
        Assinar
      </Button>
    </Card>
  );
}

/** Primeira tela de quem acabou de se cadastrar: nada conectado ainda. */
function ConectarVazio() {
  return (
    <EmptyState
      data-tour="conectar"
      icone="🏦"
      titulo="Conecte seu banco"
      descricao="Conecte suas contas via Open Finance e veja saldo, fatura projetada, investimentos e seu limite seguro do mês em um só lugar."
      acao={
        <Button variant="emerald" render={<Link href="/contas" />}>
          Conectar banco
        </Button>
      }
    />
  );
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
function mesLabel(d: Date): string {
  return `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}
