import Link from "next/link";
import { ArrowLeft, ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { carregarFechamento } from "@/lib/monthly-close-data";
import { mesAFechar, mesAnterior, rotuloMes } from "@/lib/monthly-close";
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
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Fechamento</h1>
          <p className="mt-1 capitalize text-slate">{rotuloMes(mes)}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Link
            href={`/fechamento?mes=${anterior}`}
            aria-label={`Ver ${rotuloMes(anterior)}`}
            className="grid size-9 place-items-center rounded-lg border border-line text-slate transition-colors hover:bg-paper"
          >
            <ArrowLeft className="size-4" />
          </Link>
          {proximo ? (
            <Link
              href={`/fechamento?mes=${proximo}`}
              aria-label={`Ver ${rotuloMes(proximo)}`}
              className="grid size-9 place-items-center rounded-lg border border-line text-slate transition-colors hover:bg-paper"
            >
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-lg border border-line text-line"
            >
              <ArrowRight className="size-4" />
            </span>
          )}
        </div>
      </div>

      {f.numTransacoes === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-soft text-2xl">
            📅
          </div>
          <h2 className="font-display text-xl font-bold text-ink">
            Nenhuma movimentação em {rotuloMes(mes)}
          </h2>
          <p className="mx-auto mt-2 max-w-sm leading-relaxed text-slate">
            Quando houver transações nesse mês, o fechamento aparece aqui — e chega
            no seu WhatsApp no dia 1º.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Destaque: o que sobrou (ou faltou) */}
          <div
            className={`rounded-2xl border p-6 ${
              positivo ? "border-emerald/30 bg-emerald-soft" : "border-red-200 bg-red-50"
            }`}
          >
            <p className="text-sm font-medium text-slate">
              {positivo ? "Sobrou no mês" : "Faltou no mês"}
            </p>
            <p
              className={`mt-1 font-num text-4xl font-bold ${
                positivo ? "text-[#0a6e44]" : "text-red-600"
              }`}
            >
              {formatBRL(Math.abs(f.saldo))}
            </p>
            {positivo && f.entradas > 0 && (
              <p className="mt-1 text-sm text-[#0a6e44]">
                {Math.round(f.taxaPoupanca * 100)}% da sua renda do mês
              </p>
            )}
            {!positivo && (
              <p className="mt-1 text-sm text-red-600">
                Você gastou mais do que entrou neste mês.
              </p>
            )}
          </div>

          {/* Entradas × saídas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="text-sm text-slate">Entrou</p>
              <p className="mt-1 font-num text-xl font-bold text-ink">
                {formatBRL(f.entradas)}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="text-sm text-slate">Saiu</p>
              <p className="mt-1 font-num text-xl font-bold text-ink">
                {formatBRL(f.saidas)}
              </p>
              {f.variacaoGastoPct !== null && Math.abs(f.variacaoGastoPct) >= 0.01 && (
                <p
                  className={`mt-1 flex items-center gap-1 text-xs ${
                    f.variacaoGastoPct > 0 ? "text-red-600" : "text-emerald"
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
            </div>
          </div>

          {/* Onde foi o dinheiro */}
          {f.topCategorias.length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-base font-bold text-ink">
                Onde foi o dinheiro
              </h2>
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
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper">
                      <div
                        className="h-full rounded-full bg-emerald"
                        style={{ width: `${(c.total / maxCat) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rodapé: maior gasto + volume */}
          <div className="rounded-2xl border border-line bg-white p-5 text-sm text-slate">
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
          </div>
        </div>
      )}
    </div>
  );
}
