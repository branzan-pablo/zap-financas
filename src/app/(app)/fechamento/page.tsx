import Link from "next/link";
import { ArrowLeft, ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { carregarFechamento } from "@/lib/monthly-close-data";
import { mesAFechar, mesAnterior, rotuloMes } from "@/lib/monthly-close";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/meter";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { formatBRL } from "@/lib/format";

/**
 * Fechamento mensal na web (Fase 6 P1b) — a mesma consolidação que o assistente
 * manda por WhatsApp, em formato visual. Fonte única: `carregarFechamento`.
 *
 * Next.js 16: `searchParams` é uma Promise.
 */

/** Mês seguinte a `mes`, ou null se seria no futuro (não há o que fechar). */
function mesSeguinte(mes: string, limite: string): string | null {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(ano, m, 1);
  const prox = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return prox <= limite ? prox : null;
}

const VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function FechamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoje = new Date();
  const ultimoFechavel = mesAFechar(hoje);
  const pedido = (await searchParams).mes;
  const mes = pedido && VALIDO.test(pedido) && pedido <= ultimoFechavel ? pedido : ultimoFechavel;

  const f = await carregarFechamento(supabase, user!.id, mes);
  const anterior = mesAnterior(mes);
  const proximo = mesSeguinte(mes, ultimoFechavel);

  const positivo = f.saldo >= 0;
  const maxCat = Math.max(1, ...f.topCategorias.map((c) => c.total));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        titulo="Fechamento"
        descricao={<span className="capitalize">{rotuloMes(mes)}</span>}
        className="items-end"
        acao={
          <div className="flex gap-1">
            <Link
              href={`/fechamento?mes=${anterior}`}
              aria-label={`Ver ${rotuloMes(anterior)}`}
              className="grid size-11 place-items-center rounded-lg border border-line text-slate transition-colors hover:bg-paper md:size-9"
            >
              <ArrowLeft className="size-4" />
            </Link>
            {proximo ? (
              <Link
                href={`/fechamento?mes=${proximo}`}
                aria-label={`Ver ${rotuloMes(proximo)}`}
                className="grid size-11 place-items-center rounded-lg border border-line text-slate transition-colors hover:bg-paper md:size-9"
              >
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <span
                aria-hidden
                className="grid size-11 place-items-center rounded-lg border border-line text-line md:size-9"
              >
                <ArrowRight className="size-4" />
              </span>
            )}
          </div>
        }
      />

      {f.numTransacoes === 0 ? (
        <EmptyState
          icone="📅"
          titulo={`Nenhuma movimentação em ${rotuloMes(mes)}`}
          descricao="Quando houver transações nesse mês, o fechamento aparece aqui — e chega no seu WhatsApp no dia 1º."
        />
      ) : (
        <div className="space-y-4">
          {/* Destaque: o que sobrou (ou faltou) */}
          <Card padding="lg" tone={positivo ? "ok" : "estouro"}>
            <p className="text-sm font-medium text-slate">
              {positivo ? "Sobrou no mês" : "Faltou no mês"}
            </p>
            <p
              className={`mt-1 font-num text-4xl font-bold ${
                positivo ? "text-emerald-ink" : "text-danger"
              }`}
            >
              {formatBRL(Math.abs(f.saldo))}
            </p>
            {positivo && f.entradas > 0 && (
              <p className="mt-1 text-sm text-emerald-ink">
                {Math.round(f.taxaPoupanca * 100)}% da sua renda do mês
              </p>
            )}
            {!positivo && (
              <p className="mt-1 text-sm text-danger">
                Você gastou mais do que entrou neste mês.
              </p>
            )}
          </Card>

          {/* Entradas × saídas */}
          <div className="grid grid-cols-2 gap-4">
            <StatTile size="md" titulo="Entrou" valor={formatBRL(f.entradas)} />
            <Card>
              <p className="text-sm text-slate">Saiu</p>
              <p className="mt-1 font-num text-xl font-bold text-ink">
                {formatBRL(f.saidas)}
              </p>
              {f.variacaoGastoPct !== null && Math.abs(f.variacaoGastoPct) >= 0.01 && (
                <p
                  className={`mt-1 flex items-center gap-1 text-xs ${
                    f.variacaoGastoPct > 0 ? "text-danger" : "text-emerald"
                  }`}
                >
                  {f.variacaoGastoPct > 0 ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  {Math.abs(Math.round(f.variacaoGastoPct * 100))}%{" "}
                  {f.variacaoGastoPct > 0 ? "mais" : "menos"} que o mês anterior
                </p>
              )}
            </Card>
          </div>

          {/* Onde foi o dinheiro */}
          {f.topCategorias.length > 0 && (
            <Card>
              <CardTitle className="text-base">Onde foi o dinheiro</CardTitle>
              <ul className="mt-4 space-y-3">
                {f.topCategorias.map((c) => (
                  <li key={c.nome}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-medium text-ink">
                        {c.nome}
                      </span>
                      <span className="shrink-0 text-sm text-slate">
                        <span className="font-num font-semibold text-ink">
                          {formatBRL(c.total)}
                        </span>{" "}
                        · {Math.round(c.pct * 100)}%
                      </span>
                    </div>
                    <Meter
                      className="mt-1.5"
                      valor={c.total}
                      max={maxCat}
                      label={`${c.nome}: ${formatBRL(c.total)}`}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Rodapé: maior gasto + volume */}
          <Card className="text-sm text-slate">
            {f.maiorGasto && (
              <p>
                Maior gasto:{" "}
                <span className="font-medium text-ink">{f.maiorGasto.descricao}</span> —{" "}
                <span className="font-num font-semibold text-ink">
                  {formatBRL(f.maiorGasto.valor)}
                </span>
              </p>
            )}
            <p className={f.maiorGasto ? "mt-1" : undefined}>
              {f.numTransacoes} transaç{f.numTransacoes === 1 ? "ão" : "ões"} no mês.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
