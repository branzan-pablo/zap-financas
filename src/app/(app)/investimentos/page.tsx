import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
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
      <PageHeader
        titulo="Investimentos"
        descricao="CDB, LCI, Tesouro, fundos, ações — tudo consolidado."
      />

      {investimentos.length === 0 ? (
        <EmptyState
          icone="📈"
          titulo="Nenhum investimento conectado"
          descricao={
            <>
              Conecte uma corretora em{" "}
              <Link href="/contas" className="font-medium text-emerald underline">
                Contas
              </Link>{" "}
              para consolidar sua carteira aqui.
            </>
          }
        />
      ) : (
        <>
          {/* Resumo da carteira */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatTile size="md" titulo="Patrimônio atual" valor={formatBRL(totalAtual)} />
            <StatTile size="md" titulo="Total aplicado" valor={formatBRL(totalAplicado)} />
            <Card>
              <p className="text-sm text-slate">Rendimento</p>
              <p
                className={`mt-1 font-num text-xl font-bold ${
                  ganho >= 0 ? "text-emerald" : "text-danger"
                }`}
              >
                {ganho >= 0 ? "+" : ""}
                {formatBRL(ganho)}{" "}
                <span className="text-sm font-medium">
                  ({ganhoPct >= 0 ? "+" : ""}
                  {ganhoPct.toFixed(1)}%)
                </span>
              </p>
            </Card>
          </div>

          {/* Posições */}
          <Card padding="none" className="overflow-hidden">
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
                          rend >= 0 ? "text-emerald" : "text-danger"
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
          </Card>
        </>
      )}
    </div>
  );
}
