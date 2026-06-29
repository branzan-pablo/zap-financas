import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";
import { mapaParcelas, type ParcelaInput } from "@/lib/installments";

type Cartao = {
  id: string;
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
      .select("id, nome, bandeira, limite, dia_fechamento, dia_vencimento")
      .eq("ativo", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("installments")
      .select("descricao, valor_parcela, total_parcelas, parcela_atual, primeira_parcela"),
  ]);

  const cartoes = (cardsData ?? []) as Cartao[];
  const parcelas = (instData ?? []) as ParcelaInput[];

  // Mapa de parcelas a partir do mês atual (cálculo server-side).
  const mapa = mapaParcelas(parcelas, new Date(), 12);
  const comprometidoTotal = mapa.reduce((s, m) => s + m.total, 0);
  const maxMes = Math.max(1, ...mapa.map((m) => m.total));

  if (cartoes.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <Header />
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-soft text-2xl">
            💳
          </div>
          <h2 className="font-display text-xl font-bold text-ink">
            Nenhum cartão conectado
          </h2>
          <p className="mx-auto mt-2 max-w-sm leading-relaxed text-slate">
            Conecte um cartão em{" "}
            <Link href="/contas" className="font-medium text-emerald underline">
              Contas
            </Link>{" "}
            para ver o mapa de parcelas futuras.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Header />

      {/* Cartões */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {cartoes.map((c) => (
          <div key={c.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-ink">{c.nome}</p>
                <p className="text-xs text-slate capitalize">{c.bandeira}</p>
              </div>
              <span className="rounded-md bg-paper px-2 py-0.5 text-xs text-slate">
                fecha dia {c.dia_fechamento} · vence dia {c.dia_vencimento}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate">Limite</p>
            <p className="font-num font-semibold text-ink">
              {formatBRL(c.limite)}
            </p>
          </div>
        ))}
      </div>

      {/* Mapa de parcelas */}
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-lg font-bold text-ink">
          Parcelas futuras
        </h2>
        <span className="text-sm text-slate">
          Comprometido: <span className="font-num font-semibold text-ink">
            {formatBRL(comprometidoTotal)}
          </span>
        </span>
      </div>

      {mapa.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-slate">
          Nenhuma compra parcelada em aberto. 🎉
        </p>
      ) : (
        <div className="space-y-2">
          {mapa.map((m) => (
            <div
              key={m.mes}
              className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3"
            >
              <span className="w-14 shrink-0 text-sm font-medium text-slate">
                {rotuloMes(m.mes)}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full rounded-full bg-emerald"
                  style={{ width: `${(m.total / maxMes) * 100}%` }}
                />
              </div>
              <span
                className="w-24 shrink-0 text-right font-num font-semibold text-ink"
                title={m.itens
                  .map((i) => `${i.descricao} (${i.parcela}/${i.total})`)
                  .join("\n")}
              >
                {formatBRL(m.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold text-ink">Cartões</h1>
      <p className="mt-1 text-slate">
        Cartões conectados e mapa de parcelas futuras mês a mês.
      </p>
    </div>
  );
}
