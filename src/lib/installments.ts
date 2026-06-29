/**
 * Projeção de parcelas futuras (mapa de comprometimento mês a mês).
 *
 * Função PURA e testável — base do "mapa de parcelas" da tela de cartões e,
 * mais adiante (Fase 2), do motor de fatura projetada. Sem I/O.
 */

export type ParcelaInput = {
  descricao: string;
  valor_parcela: number;
  total_parcelas: number;
  parcela_atual: number;
  primeira_parcela: string; // YYYY-MM-DD
};

export type MesProjetado = {
  mes: string; // YYYY-MM
  total: number; // soma das parcelas que caem no mês
  itens: { descricao: string; parcela: number; total: number; valor: number }[];
};

/** Chave de mês `YYYY-MM` a partir de uma data + N meses adiante. */
function mesChave(base: Date, addMeses: number): string {
  const d = new Date(base.getFullYear(), base.getMonth() + addMeses, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Projeta o comprometimento de parcelas a partir de `mesReferencia` (inclusive)
 * para os próximos `mesesAFrente` meses.
 *
 * @param parcelas    registros de installments do usuário
 * @param mesReferencia data âncora (normalmente "hoje"); injetada p/ ser testável
 * @param mesesAFrente quantos meses projetar (default 12)
 */
export function mapaParcelas(
  parcelas: ParcelaInput[],
  mesReferencia: Date,
  mesesAFrente = 12
): MesProjetado[] {
  const ref = new Date(
    mesReferencia.getFullYear(),
    mesReferencia.getMonth(),
    1
  );
  // Mapa mes(YYYY-MM) → acumulador
  const meses = new Map<string, MesProjetado>();
  for (let i = 0; i < mesesAFrente; i++) {
    const k = mesChave(ref, i);
    meses.set(k, { mes: k, total: 0, itens: [] });
  }

  for (const p of parcelas) {
    const base = new Date(p.primeira_parcela + "T12:00:00");
    // Cada parcela n (1..total) cai em primeira_parcela + (n-1) meses.
    for (let n = 1; n <= p.total_parcelas; n++) {
      const mes = mesChave(
        new Date(base.getFullYear(), base.getMonth() + (n - 1), 1),
        0
      );
      const bucket = meses.get(mes);
      if (!bucket) continue; // fora da janela projetada
      bucket.total = Math.round((bucket.total + p.valor_parcela) * 100) / 100;
      bucket.itens.push({
        descricao: p.descricao,
        parcela: n,
        total: p.total_parcelas,
        valor: p.valor_parcela,
      });
    }
  }

  // Só meses com algum comprometimento.
  return [...meses.values()].filter((m) => m.itens.length > 0);
}
