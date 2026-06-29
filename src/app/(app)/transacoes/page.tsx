import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatData } from "@/lib/format";

type Categoria = { id: string; nome: string; icone: string | null; cor: string | null };

type Transacao = {
  id: string;
  valor: number;
  descricao: string;
  data: string;
  tipo: string;
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

  // Extrato (RLS limita ao usuário); filtro opcional por categoria.
  let query = supabase
    .from("transactions")
    .select("id, valor, descricao, data, tipo, categories(id, nome, icone, cor)")
    .order("data", { ascending: false })
    .limit(200);
  if (categoria) query = query.eq("category_id", categoria);

  const { data } = await query;
  const transacoes = (data ?? []) as unknown as Transacao[];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Transações</h1>
        <p className="mt-1 text-slate">
          Seu extrato consolidado, categorizado automaticamente.
        </p>
      </div>

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
                  <span
                    className={`shrink-0 font-num font-semibold ${
                      credito ? "text-emerald" : "text-ink"
                    }`}
                  >
                    {credito ? "+" : ""}
                    {formatBRL(t.valor)}
                  </span>
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
