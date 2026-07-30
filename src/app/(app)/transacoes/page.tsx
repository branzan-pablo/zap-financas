import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatBRL, formatData } from "@/lib/format";
import { criarLancamento, excluirLancamento } from "./actions";

type Categoria = { id: string; nome: string; icone: string | null; cor: string | null };

type Transacao = {
  id: string;
  valor: number;
  descricao: string;
  data: string;
  tipo: string;
  origem: string | null;
  categories: Categoria | null;
};

export default async function TransacoesPage({
  searchParams,
}: {
  // Next.js 16: searchParams é assíncrono.
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createClient();

  // Categorias (globais + do usuário) para os chips de filtro.
  const { data: cats } = await supabase
    .from("categories")
    .select("id, nome, icone, cor")
    .order("nome", { ascending: true });
  const categorias = (cats ?? []) as Categoria[];

  // Contas ativas — destino dos lançamentos manuais.
  const { data: accs } = await supabase
    .from("accounts")
    .select("id, nome")
    .eq("ativo", true)
    .order("created_at", { ascending: true });
  const contas = (accs ?? []) as { id: string; nome: string }[];

  // Extrato (RLS limita ao usuário); filtro opcional por categoria.
  let query = supabase
    .from("transactions")
    .select("id, valor, descricao, data, tipo, origem, categories(id, nome, icone, cor)")
    .order("data", { ascending: false })
    .limit(200);
  if (categoria) query = query.eq("category_id", categoria);

  const { data } = await query;
  const transacoes = (data ?? []) as unknown as Transacao[];

  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Transações</h1>
        <p className="mt-1 text-slate">
          Seu extrato consolidado, categorizado automaticamente.
        </p>
      </div>

      {/* Lançamento manual — o que o Open Finance não traz (dinheiro, VR). */}
      {contas.length > 0 && (
        <details className="mb-5 rounded-2xl border border-line bg-white p-5">
          <summary className="cursor-pointer font-medium text-ink">
            + Novo lançamento
          </summary>
          <form action={criarLancamento} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate">Descrição</span>
              <input
                type="text"
                name="descricao"
                required
                maxLength={120}
                placeholder="Pão na padaria"
                className="w-48 rounded-lg border border-line px-3 py-1.5 text-ink"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate">Valor</span>
              <input
                type="number"
                name="valor"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                className="w-28 rounded-lg border border-line px-3 py-1.5 text-ink"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate">Tipo</span>
              <select
                name="tipo"
                defaultValue="gasto"
                className="rounded-lg border border-line px-3 py-1.5 text-ink"
              >
                <option value="gasto">Gasto</option>
                <option value="entrada">Entrada</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate">Data</span>
              <input
                type="date"
                name="data"
                defaultValue={hojeStr}
                className="rounded-lg border border-line px-3 py-1.5 text-ink"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate">Conta</span>
              <select
                name="conta"
                className="max-w-40 rounded-lg border border-line px-3 py-1.5 text-ink"
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate">Categoria</span>
              <select
                name="categoria"
                defaultValue=""
                className="max-w-40 rounded-lg border border-line px-3 py-1.5 text-ink"
              >
                <option value="">Automática (IA)</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.icone ?? ""} ${c.nome}`.trim()}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm">
              Lançar
            </Button>
          </form>
          <p className="mt-3 text-xs leading-relaxed text-slate">
            Em contas manuais o saldo é ajustado automaticamente. Em contas
            conectadas, o saldo continua vindo do banco.
          </p>
        </details>
      )}

      {/* Filtro por categoria */}
      {categorias.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <FiltroChip ativo={!categoria} href="/transacoes" label="Todas" />
          {categorias.map((c) => (
            <FiltroChip
              key={c.id}
              ativo={categoria === c.id}
              href={`/transacoes?categoria=${c.id}`}
              label={`${c.icone ?? ""} ${c.nome}`.trim()}
            />
          ))}
        </div>
      )}

      {transacoes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <p className="font-display text-lg font-bold text-ink">
            Nenhuma transação ainda
          </p>
          <p className="mx-auto mt-2 max-w-sm text-slate">
            Conecte uma conta em{" "}
            <Link href="/contas" className="font-medium text-emerald underline">
              Contas
            </Link>{" "}
            para ver seu extrato aqui.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <ul className="divide-y divide-line">
            {transacoes.map((t) => {
              const credito = t.valor >= 0;
              const cat = t.categories;
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-full text-base"
                      style={{ backgroundColor: (cat?.cor ?? "#94a3b8") + "22" }}
                      aria-hidden
                    >
                      {cat?.icone ?? "📌"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">
                        {t.descricao}
                      </p>
                      <p className="text-xs text-slate">
                        {formatData(t.data)}
                        {cat ? ` · ${cat.nome}` : " · Sem categoria"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`font-num font-semibold ${
                        credito ? "text-emerald" : "text-ink"
                      }`}
                    >
                      {credito ? "+" : ""}
                      {formatBRL(t.valor)}
                    </span>
                    {/* Só lançamentos manuais/WhatsApp podem ser excluídos —
                        os do Open Finance voltariam no próximo sync. */}
                    {t.origem !== "openfinance" && (
                      <form action={excluirLancamento}>
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          aria-label={`Excluir ${t.descricao}`}
                          title="Excluir lançamento"
                          className="text-sm text-slate transition-colors hover:text-red-600"
                        >
                          ✕
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function FiltroChip({
  ativo,
  href,
  label,
}: {
  ativo: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        ativo
          ? "border-emerald bg-emerald-soft text-[#0a6e44]"
          : "border-line text-slate hover:bg-paper hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
