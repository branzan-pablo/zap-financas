import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/meter";
import { PageHeader } from "@/components/ui/page-header";
import { formatBRL, formatData } from "@/lib/format";
import { mapaParcelas, type ParcelaInput } from "@/lib/installments";
import { faturaAtual, type FaturaTransacao } from "@/lib/fatura";

type Cartao = {
  id: string;
  account_id: string | null;
  nome: string;
  bandeira: string | null;
  limite: number | null;
  dia_fechamento: number | null;
  dia_vencimento: number | null;
};

const MES_LABEL = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function rotuloMes(ym: string): string {
  const [a, m] = ym.split("-");
  return `${MES_LABEL[Number(m) - 1]}/${a.slice(2)}`;
}

export default async function CartoesPage() {
  const supabase = await createClient();

  const [{ data: cardsData }, { data: instData }] = await Promise.all([
    supabase
      .from("cards")
      .select("id, account_id, nome, bandeira, limite, dia_fechamento, dia_vencimento")
      .eq("ativo", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("installments")
      .select("descricao, valor_parcela, total_parcelas, parcela_atual, primeira_parcela"),
  ]);

  const cartoes = (cardsData ?? []) as Cartao[];
  const parcelas = (instData ?? []) as ParcelaInput[];

  // Transações das contas dos cartões → base p/ a fatura aberta de cada cartão.
  const contaIds = cartoes
    .map((c) => c.account_id)
    .filter((id): id is string => id !== null);
  const { data: txData } = contaIds.length
    ? await supabase
        .from("transactions")
        .select("account_id, valor, data")
        .in("account_id", contaIds)
    : { data: [] };
  const txPorConta = new Map<string, FaturaTransacao[]>();
  for (const t of (txData ?? []) as { account_id: string; valor: number; data: string }[]) {
    const arr = txPorConta.get(t.account_id) ?? [];
    arr.push({ valor: t.valor, data: t.data });
    txPorConta.set(t.account_id, arr);
  }

  const hoje = new Date();
  // Fatura aberta por cartão (cálculo server-side).
  const faturaPorCartao = new Map(
    cartoes.map((c) => [
      c.id,
      c.dia_fechamento && c.dia_vencimento
        ? faturaAtual(
            c.account_id ? txPorConta.get(c.account_id) ?? [] : [],
            c.dia_fechamento,
            c.dia_vencimento,
            hoje
          )
        : null,
    ])
  );

  // Mapa de parcelas a partir do mês atual (cálculo server-side).
  const mapa = mapaParcelas(parcelas, hoje, 12);
  const comprometidoTotal = mapa.reduce((s, m) => s + m.total, 0);
  const maxMes = Math.max(1, ...mapa.map((m) => m.total));

  if (cartoes.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <Header />
        <EmptyState
          icone="💳"
          titulo="Nenhum cartão conectado"
          descricao={
            <>
              Conecte um cartão em{" "}
              <Link href="/contas" className="font-medium text-emerald underline">
                Contas
              </Link>{" "}
              para ver o mapa de parcelas futuras.
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Header />

      {/* Cartões */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {cartoes.map((c) => {
          const fatura = faturaPorCartao.get(c.id);
          const usoPct =
            fatura && c.limite && c.limite > 0
              ? Math.min(100, (fatura.total / c.limite) * 100)
              : 0;
          return (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink">{c.nome}</p>
                  <p className="text-xs text-slate capitalize">{c.bandeira}</p>
                </div>
                {fatura && (
                  <span className="rounded-md bg-paper px-2 py-0.5 text-xs text-slate">
                    fecha {formatData(fatura.fechamento)} · vence{" "}
                    {formatData(fatura.vencimento)}
                  </span>
                )}
              </div>

              <p className="mt-4 text-xs text-slate">Fatura aberta</p>
              <p className="font-num text-xl font-bold text-ink">
                {formatBRL(fatura?.total ?? 0)}
              </p>

              {/* Uso do limite */}
              <div className="mt-3">
                <Meter
                  className="h-1.5"
                  valor={usoPct}
                  tone={usoPct >= 80 ? "atencao" : "ok"}
                  label={`Uso do limite de ${c.nome}`}
                />
                <p className="mt-1 text-xs text-slate">
                  {formatBRL(fatura?.total ?? 0)} de {formatBRL(c.limite)} ·{" "}
                  {usoPct.toFixed(0)}% do limite
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Mapa de parcelas */}
      <div className="mb-3 flex items-end justify-between">
        <CardTitle>Parcelas futuras</CardTitle>
        <span className="text-sm text-slate">
          Comprometido: <span className="font-num font-semibold text-ink">
            {formatBRL(comprometidoTotal)}
          </span>
        </span>
      </div>

      {mapa.length === 0 ? (
        <EmptyState size="sm" descricao="Nenhuma compra parcelada em aberto. 🎉" />
      ) : (
        <div className="space-y-2">
          {mapa.map((m) => (
            <Card
              key={m.mes}
              padding="none"
              className="flex items-center gap-3 rounded-xl px-4 py-3"
            >
              <span className="w-14 shrink-0 text-sm font-medium text-slate">
                {rotuloMes(m.mes)}
              </span>
              <Meter
                className="flex-1"
                valor={m.total}
                max={maxMes}
                label={`${rotuloMes(m.mes)}: ${formatBRL(m.total)}`}
              />
              <span
                className="w-24 shrink-0 text-right font-num font-semibold text-ink"
                title={m.itens
                  .map((i) => `${i.descricao} (${i.parcela}/${i.total})`)
                  .join("\n")}
              >
                {formatBRL(m.total)}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <PageHeader
      titulo="Cartões"
      descricao="Cartões conectados e mapa de parcelas futuras mês a mês."
    />
  );
}
