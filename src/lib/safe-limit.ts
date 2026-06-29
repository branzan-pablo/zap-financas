/**
 * "Limite seguro do mês" — quanto ainda dá para gastar com segurança.
 *
 * Função PURA e testável (Fase 2). Sem I/O. A regra é honesta e simples:
 *
 *   disponível = renda do mês − já gasto − comprometido a vencer
 *   por dia    = disponível ÷ dias restantes no mês
 *
 * O caller (dashboard) calcula os insumos a partir das transações reais.
 */

export type LimiteSeguro = {
  renda: number; // entrada estimada do mês
  gasto: number; // débitos já lançados no mês
  comprometido: number; // parcelas/assinaturas que ainda vão cair no mês
  disponivel: number; // renda − gasto − comprometido (pode ser negativo)
  porDia: number; // disponível ÷ dias restantes
  status: "folga" | "atencao" | "estouro";
};

/**
 * @param renda          entrada estimada do mês (créditos)
 * @param gasto          débitos já lançados no mês
 * @param comprometido   parcelas/assinaturas ainda a vencer neste mês
 * @param diasRestantes  dias restantes até o fim do mês (>= 0)
 * @param margemAtencao  fração da renda abaixo da qual o status é "atenção" (default 15%)
 */
export function calcularLimiteSeguro(
  renda: number,
  gasto: number,
  comprometido: number,
  diasRestantes: number,
  margemAtencao = 0.15
): LimiteSeguro {
  const disponivel = Math.round((renda - gasto - comprometido) * 100) / 100;
  const porDia =
    diasRestantes > 0
      ? Math.round((disponivel / diasRestantes) * 100) / 100
      : disponivel;

  let status: LimiteSeguro["status"];
  if (disponivel < 0) status = "estouro";
  else if (disponivel < renda * margemAtencao) status = "atencao";
  else status = "folga";

  return { renda, gasto, comprometido, disponivel, porDia, status };
}

/** Dias restantes no mês (incluindo hoje) a partir de uma data de referência. */
export function diasRestantesNoMes(hoje: Date): number {
  const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  return ultimo - hoje.getDate() + 1;
}
