import { createClient } from "@/lib/supabase/server";
import { orcamentosVigentes, LIMIAR_ATENCAO } from "@/lib/budgets";
import { resumoFinanceiro } from "@/lib/finance-summary";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Meter } from "@/components/ui/meter";
import { PageHeader } from "@/components/ui/page-header";
import { type Tone } from "@/components/ui/tone";
import { definirOrcamento } from "./actions";

/**
 * Orçamentos por categoria (Fase 6 P1).
 *
 * O usuário define um limite mensal por categoria; o valor vale deste mês em
 * diante (carry-over — ver src/lib/budgets.ts). O progresso usa o gasto do mês
 * corrente da MESMA fonte do dashboard/alertas (resumoFinanceiro).
 */

type CategoriaRow = {
  id: string;
  nome: string;
  icone: string | null;
  cor: string | null;
};

// Categorias que não fazem sentido orçar (entradas/movimentações, não gastos).
const SEM_ORCAMENTO = /sal[áa]rio|receita|transfer[êe]ncia|investimento/i;


export default async function OrcamentosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoje = new Date();
  const mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const [{ data: cats }, { data: buds }, resumo] = await Promise.all([
    supabase
      .from("categories")
      .select("id, nome, icone, cor")
      .or(`user_id.is.null,user_id.eq.${user!.id}`)
      .order("nome"),
    supabase
      .from("budgets")
      .select("category_id, limite, mes_referencia")
      .eq("user_id", user!.id),
    resumoFinanceiro(supabase, user!.id, hoje),
  ]);

  const categorias = ((cats ?? []) as CategoriaRow[]).filter(
    (c) => !SEM_ORCAMENTO.test(c.nome)
  );
  const vigentes = orcamentosVigentes(buds ?? [], mes);
  const gastoPorCat = new Map(
    resumo.gastosPorCategoria
      .filter((c) => c.id != null)
      .map((c) => [c.id as string, c.total])
  );

  const comOrcamento = categorias.filter((c) => vigentes.has(c.id));
  const semOrcamento = categorias.filter((c) => !vigentes.has(c.id));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Orçamentos"
        descricao={`Defina um limite mensal por categoria. Eu te aviso no dashboard e no WhatsApp quando o gasto passar de ${Math.round(LIMIAR_ATENCAO * 100)}% — e quando estourar.`}
      />

      {comOrcamento.length > 0 && (
        <div className="mb-8 space-y-3">
          <CardTitle>Ativos</CardTitle>
          {comOrcamento.map((c) => {
            const limite = vigentes.get(c.id)!;
            const gasto = gastoPorCat.get(c.id) ?? 0;
            const pct = limite > 0 ? gasto / limite : 0;
            const status: Tone =
              pct > 1 ? "estouro" : pct >= LIMIAR_ATENCAO ? "atencao" : "ok";
            return (
              <Card key={c.id} padding="sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span aria-hidden>{c.icone ?? "📌"}</span>
                    <span className="truncate font-medium text-ink">{c.nome}</span>
                  </div>
                  <p className="shrink-0 text-sm text-slate">
                    <span
                      className={`font-num font-semibold ${
                        status === "estouro" ? "text-danger" : "text-ink"
                      }`}
                    >
                      {formatBRL(gasto)}
                    </span>{" "}
                    / {formatBRL(limite)}
                  </p>
                </div>
                <Meter
                  className="mt-3"
                  valor={pct * 100}
                  tone={status}
                  label={`${c.nome}: ${formatBRL(gasto)} de ${formatBRL(limite)}`}
                />
                <div className="mt-3 flex items-center gap-2">
                  <form action={definirOrcamento} className="flex items-center gap-2">
                    <input type="hidden" name="categoria" value={c.id} />
                    <Input
                      type="number"
                      name="limite"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      defaultValue={limite}
                      aria-label={`Limite mensal para ${c.nome}`}
                      className="w-32 font-num"
                    />
                    <Button variant="outline" size="sm" type="submit">
                      Salvar
                    </Button>
                  </form>
                  <form action={definirOrcamento} className="ml-auto">
                    <input type="hidden" name="categoria" value={c.id} />
                    <input type="hidden" name="limite" value="0" />
                    <button type="submit" className="text-sm text-slate hover:text-danger">
                      Remover
                    </button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <CardTitle>
          {comOrcamento.length > 0 ? "Adicionar em outra categoria" : "Escolha uma categoria"}
        </CardTitle>
        {comOrcamento.length === 0 && (
          <EmptyState
            size="sm"
            icone="🎯"
            descricao="Sem orçamento definido ainda. Escolha uma categoria abaixo, defina o limite do mês e deixe que eu vigio por você."
          />
        )}
        <Card padding="none" className="divide-y divide-line overflow-hidden" render={<ul />}>
          {semOrcamento.map((c) => {
            const gasto = gastoPorCat.get(c.id) ?? 0;
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span aria-hidden>{c.icone ?? "📌"}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{c.nome}</p>
                    {gasto > 0 && (
                      <p className="text-xs text-slate">
                        {formatBRL(gasto)} gastos este mês
                      </p>
                    )}
                  </div>
                </div>
                <form action={definirOrcamento} className="flex shrink-0 items-center gap-2">
                  <input type="hidden" name="categoria" value={c.id} />
                  <Input
                    type="number"
                    name="limite"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="R$ limite"
                    aria-label={`Limite mensal para ${c.nome}`}
                    className="w-28 font-num"
                  />
                  <Button variant="outline" size="sm" type="submit">
                    Definir
                  </Button>
                </form>
              </li>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
