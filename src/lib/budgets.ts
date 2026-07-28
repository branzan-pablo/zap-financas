/**
 * Orçamentos por categoria (Fase 6 P1) — funções PURAS e testáveis.
 *
 * Semântica: um orçamento vale "a partir de" seu `mes_referencia` (dia 1) e
 * CONTINUA valendo nos meses seguintes até ser substituído por uma linha mais
 * recente da mesma categoria — assim o usuário define uma vez e não precisa
 * recriar todo mês, mas o histórico fica preservado (linha nova por mês editado).
 * `limite <= 0` desliga o orçamento da categoria (linha explícita de remoção).
 */

export type BudgetRow = {
  category_id: string | null;
  limite: number;
  mes_referencia: string; // date YYYY-MM-DD (sempre dia 1)
};

export type OrcamentoStatus = {
  categoriaId: string;
  categoria: string;
  limite: number;
  gasto: number;
  /** 0..N — fração do limite consumida (1 = 100%). */
  pct: number;
  status: "ok" | "atencao" | "estouro";
};

/** Limiar de "atenção" (fração do limite). */
export const LIMIAR_ATENCAO = 0.8;

/**
 * Resolve os orçamentos vigentes num mês: para cada categoria, a linha com o
 * `mes_referencia` mais recente que seja <= o mês pedido. Limite <= 0 = desligado.
 */
export function orcamentosVigentes(
  rows: BudgetRow[],
  mes: string // "YYYY-MM"
): Map<string, number> {
  const corte = `${mes}-31`; // compara lexicograficamente com YYYY-MM-DD
  const vigente = new Map<string, { mes: string; limite: number }>();
  for (const r of rows) {
    if (!r.category_id || r.mes_referencia > corte) continue;
    const atual = vigente.get(r.category_id);
    if (!atual || r.mes_referencia > atual.mes) {
      vigente.set(r.category_id, { mes: r.mes_referencia, limite: r.limite });
    }
  }
  const out = new Map<string, number>();
  for (const [catId, v] of vigente) {
    if (v.limite > 0) out.set(catId, v.limite);
  }
  return out;
}

/**
 * Cruza orçamentos vigentes com o gasto do mês por categoria.
 * `gastosPorCategoria`: total POSITIVO gasto no mês em cada categoria.
 */
export function statusOrcamentos(
  vigentes: Map<string, number>,
  gastosPorCategoria: { categoriaId: string; nome: string; total: number }[]
): OrcamentoStatus[] {
  const gastoPorCat = new Map(
    gastosPorCategoria.map((g) => [g.categoriaId, g])
  );
  const out: OrcamentoStatus[] = [];
  for (const [categoriaId, limite] of vigentes) {
    const g = gastoPorCat.get(categoriaId);
    const gasto = g?.total ?? 0;
    const pct = limite > 0 ? gasto / limite : 0;
    out.push({
      categoriaId,
      categoria: g?.nome ?? "",
      limite,
      gasto: Math.round(gasto * 100) / 100,
      pct: Math.round(pct * 1000) / 1000,
      status: pct > 1 ? "estouro" : pct >= LIMIAR_ATENCAO ? "atencao" : "ok",
    });
  }
  // Mais graves primeiro; empate = maior fração consumida.
  const ordem = { estouro: 0, atencao: 1, ok: 2 } as const;
  return out.sort(
    (a, b) => ordem[a.status] - ordem[b.status] || b.pct - a.pct
  );
}
