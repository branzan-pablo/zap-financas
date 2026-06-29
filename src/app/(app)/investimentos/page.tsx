import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";

type Investimento = {
  id: string;
  nome: string;
  tipo: string;
  valor_aplicado: number | null;
  valor_atual: number | null;
  rendimento_pct: number | null;
};

const TIPO_LABEL: Record<string, string> = {
  cdb: "CDB",
  lci: "LCI",
  lca: "LCA",
  tesouro: "Tesouro Direto",
  fundo: "Fundo",
  acao: "Ação",
  cripto: "Cripto",
  outro: "Outro",
};

export default async function InvestimentosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("investments")
    .select("id, nome, tipo, valor_aplicado, valor_atual, rendimento_pct")
    .order("valor_atual", { ascending: false });
  const investimentos = (data ?? []) as Investimento[];

  const totalAtual = investimentos.reduce((s, i) => s + (i.valor_atual ?? 0), 0);
  const totalAplicado = investimentos.reduce(
    (s, i) => s + (i.valor_aplicado ?? 0),
    0
  );
  const ganho = totalAtual - totalAplicado;
  const ganhoPct = totalAplicado > 0 ? (ganho / totalAplicado) * 100 : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          Investimentos
        </h1>
        <p className="mt-1 text-slate">
          CDB, LCI, Tesouro, fundos, ações — tudo consolidado.
        </p>
      </div>

      {investimentos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-soft text-2xl">
            📈
          </div>
          <h2 className="font-display text-xl font-bold text-ink">
            Nenhum investimento conectado
          </h2>
          <p className="mx-auto mt-2 max-w-sm leading-relaxed text-slate">
            Conecte uma corretora em{" "}
            <Link href="/contas" className="font-medium text-emerald underline">
              Contas
            </Link>{" "}
            para consolidar sua carteira aqui.
          </p>
        </div>
      ) : (
        <>
          {/* Resumo da carteira */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="text-xs text-slate">Patrimônio atual</p>
              <p className="mt-1 font-num text-xl font-bold text-ink">
                {formatBRL(totalAtual)}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="text-xs text-slate">Total aplicado</p>
              <p className="mt-1 font-num text-xl font-bold text-ink">
                {formatBRL(totalAplicado)}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="text-xs text-slate">Rendimento</p>
              <p
                className={`mt-1 font-num text-xl font-bold ${
                  ganho >= 0 ? "text-emerald" : "text-red-600"
                }`}
              >
                {ganho >= 0 ? "+" : ""}
                {formatBRL(ganho)}{" "}
                <span className="text-sm font-medium">
                  ({ganhoPct >= 0 ? "+" : ""}
                  {ganhoPct.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>

          {/* Posições */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <ul className="divide-y divide-line">
              {investimentos.map((inv) => {
                const rend = inv.rendimento_pct ?? 0;
                return (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{inv.nome}</p>
                      <p className="text-xs text-slate">
                        {TIPO_LABEL[inv.tipo] ?? inv.tipo}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-num font-semibold text-ink">
                        {formatBRL(inv.valor_atual)}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          rend >= 0 ? "text-emerald" : "text-red-600"
                        }`}
                      >
                        {rend >= 0 ? "+" : ""}
                        {rend.toFixed(2)}%
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
