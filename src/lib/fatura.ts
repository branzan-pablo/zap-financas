/**
 * Motor de fatura de cartão de crédito (cálculo do ciclo de fechamento).
 *
 * Função PURA e testável — centro da inteligência da Fase 2. Sem I/O.
 *
 * Modelo de ciclo: um cartão fecha no dia `diaFechamento` de cada mês. A
 * "fatura aberta" acumula as compras desde o dia seguinte ao último fechamento
 * até o próximo fechamento (inclusive). Vence no dia `diaVencimento`.
 *
 * Combina com [installments.ts](./installments.ts): a fatura ATUAL vem das
 * transações reais do ciclo; o COMPROMETIDO futuro (parcelas) vem do mapa de
 * parcelas. Gastos discricionários futuros não são previstos — só o que já
 * está travado.
 */

export type FaturaTransacao = {
  valor: number; // negativo = débito (compra); positivo = crédito/estorno
  data: string; // YYYY-MM-DD
};

export type Fatura = {
  inicioCiclo: string; // YYYY-MM-DD (1º dia do ciclo aberto)
  fechamento: string; // YYYY-MM-DD (dia em que a fatura fecha)
  vencimento: string; // YYYY-MM-DD (dia de pagamento)
  total: number; // soma das compras do ciclo (>= 0)
};

function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes + 1, 0).getDate();
}

/** Cria uma data com o dia "grampeado" ao tamanho do mês (ex.: dia 31 em fev → 28/29). */
function dataComDia(ano: number, mes: number, dia: number): Date {
  return new Date(ano, mes, Math.min(dia, diasNoMes(ano, mes)), 12, 0, 0);
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Próximo fechamento (>= hoje) do cartão. */
function proximoFechamento(hoje: Date, diaFechamento: number): Date {
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12);
  let fech = dataComDia(base.getFullYear(), base.getMonth(), diaFechamento);
  if (fech < base) {
    fech = dataComDia(base.getFullYear(), base.getMonth() + 1, diaFechamento);
  }
  return fech;
}

/**
 * Calcula a fatura ABERTA (atual) de um cartão a partir das suas transações.
 *
 * @param transacoes   transações da conta do cartão
 * @param diaFechamento dia de fechamento (1..31)
 * @param diaVencimento dia de vencimento (1..31)
 * @param hoje         data de referência (injetada p/ ser testável)
 */
export function faturaAtual(
  transacoes: FaturaTransacao[],
  diaFechamento: number,
  diaVencimento: number,
  hoje: Date
): Fatura {
  const fechamento = proximoFechamento(hoje, diaFechamento);

  // Início do ciclo = dia seguinte ao fechamento anterior.
  const fechAnterior = dataComDia(
    fechamento.getFullYear(),
    fechamento.getMonth() - 1,
    diaFechamento
  );
  const inicio = new Date(fechAnterior);
  inicio.setDate(inicio.getDate() + 1);

  // Vencimento: próxima ocorrência de diaVencimento após o fechamento.
  let vencimento = dataComDia(
    fechamento.getFullYear(),
    fechamento.getMonth(),
    diaVencimento
  );
  if (vencimento <= fechamento) {
    vencimento = dataComDia(
      fechamento.getFullYear(),
      fechamento.getMonth() + 1,
      diaVencimento
    );
  }

  const inicioStr = ymd(inicio);
  const fechStr = ymd(fechamento);

  // Soma das compras (débitos) cuja data cai dentro do ciclo aberto.
  let total = 0;
  for (const t of transacoes) {
    if (t.data >= inicioStr && t.data <= fechStr && t.valor < 0) {
      total += -t.valor;
    }
  }

  return {
    inicioCiclo: inicioStr,
    fechamento: fechStr,
    vencimento: ymd(vencimento),
    total: Math.round(total * 100) / 100,
  };
}
