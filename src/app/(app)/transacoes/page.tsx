import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
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
      <PageHeader
        titulo="Transações"
        descricao="Seu extrato consolidado, categorizado automaticamente."
      />

      {/* Lançamento manual — o que o Open Finance não traz (dinheiro, VR). */}
      {contas.length > 0 && (
        <Card render={<details />} className="mb-5">
          <summary className="cursor-pointer font-medium text-ink">
            + Novo lançamento
          </summary>
          {/* Empilhado no mobile (um campo por linha, polegar sobe em coluna
              reta), em grade a partir de sm. O envio ocupa a largura toda no
              celular: é a ação da tela, não um botão espremido no fim da fila. */}
          <form action={criarLancamento} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field id="l-descricao" label="Descrição" className="sm:col-span-2">
              <Input
                id="l-descricao"
                type="text"
                name="descricao"
                required
                maxLength={120}
                autoComplete="off"
                placeholder="Pão na padaria"
              />
            </Field>
            <Field id="l-valor" label="Valor">
              <Input
                id="l-valor"
                type="number"
                name="valor"
                step="0.01"
                min="0.01"
                required
                inputMode="decimal"
                placeholder="0,00"
                className="font-num"
              />
            </Field>
            <Field id="l-tipo" label="Tipo">
              <Select id="l-tipo" name="tipo" defaultValue="gasto">
                <option value="gasto">Gasto</option>
                <option value="entrada">Entrada</option>
              </Select>
            </Field>
            <Field id="l-data" label="Data">
              <Input id="l-data" type="date" name="data" defaultValue={hojeStr} />
            </Field>
            <Field id="l-conta" label="Conta">
              <Select id="l-conta" name="conta">
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="l-categoria" label="Categoria" className="sm:col-span-2">
              <Select id="l-categoria" name="categoria" defaultValue="">
                <option value="">Escolher automaticamente</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.icone ?? ""} ${c.nome}`.trim()}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Lançar
              </Button>
            </div>
          </form>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Em contas manuais o saldo é ajustado automaticamente. Em contas
            conectadas, o saldo continua vindo do banco.
          </p>
        </Card>
      )}

      {/* Filtro por categoria — faixa rolável no mobile: 13 chips empilhados
          empurravam o extrato inteiro para fora da primeira tela. */}
      {categorias.length > 0 && (
        <nav aria-label="Filtrar por categoria" className="chip-strip mb-5">
          <FiltroChip ativo={!categoria} href="/transacoes" label="Todas" />
          {categorias.map((c) => (
            <FiltroChip
              key={c.id}
              ativo={categoria === c.id}
              href={`/transacoes?categoria=${c.id}`}
              label={`${c.icone ?? ""} ${c.nome}`.trim()}
            />
          ))}
        </nav>
      )}

      {transacoes.length === 0 ? (
        <EmptyState
          titulo="Nenhuma transação ainda"
          descricao={
            <>
              Conecte uma conta em{" "}
              <Link href="/contas" className="font-medium text-emerald underline">
                Contas
              </Link>{" "}
              para ver seu extrato aqui.
            </>
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
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
                      <p className="text-sm text-slate">
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
                          aria-label={`Excluir lançamento ${t.descricao}`}
                          title="Excluir lançamento"
                          className="grid size-11 place-items-center rounded-full text-slate transition-colors hover:bg-danger-soft hover:text-danger md:size-8"
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
        </Card>
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
      aria-current={ativo ? "true" : undefined}
      className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-sm transition-colors md:min-h-0 md:py-1.5 ${
        ativo
          ? "border-emerald bg-emerald-soft font-medium text-emerald-ink"
          : "border-line bg-white text-slate hover:bg-paper hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
