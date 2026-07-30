/**
 * Fechamento mensal (Fase 6 P1b) — o "retrato" do mês que acabou.
 *
 * Funções PURAS e testáveis: recebem as transações de dois meses (o fechado e o
 * anterior, para comparação) e produzem o resumo + o texto pronto para WhatsApp.
 * Sem I/O — quem lê o banco é o cron/handler.
 */

export type TxFechamento = {
  valor: number; // negativo = gasto, positivo = entrada
  data: string; // YYYY-MM-DD
  descricao: string;
  categoria: string | null;
};

export type FechamentoMensal = {
  /** "YYYY-MM" do mês fechado. */
  mes: string;
  /** "junho de 2026" — para títulos. */
  rotulo: string;
  entradas: number;
  saidas: number;
  /** entradas - saidas (positivo = sobrou). */
  saldo: number;
  /** Fração da renda que sobrou (0..1). 0 quando não houve entradas. */
  taxaPoupanca: number;
  numTransacoes: number;
  topCategorias: { nome: string; total: number; pct: number }[];
  maiorGasto: { descricao: string; valor: number } | null;
  /** Variação % dos gastos vs. mês anterior. null se não há base de comparação. */
  variacaoGastoPct: number | null;
};

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "2026-06" → "junho de 2026". */
export function rotuloMes(mes: string): string {
  const [ano, m] = mes.split("-");
  const idx = Number(m) - 1;
  return `${MESES[idx] ?? m} de ${ano}`;
}

/** Mês anterior a `mes` ("2026-01" → "2025-12"). */
export function mesAnterior(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(ano, m - 2, 1); // m-1 é o índice; -1 volta um mês
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Mês de referência (YYYY-MM) do mês anterior a `hoje` — o mês a fechar. */
export function mesAFechar(hoje: Date): string {
  const d = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const arred = (v: number) => Math.round(v * 100) / 100;

export function fecharMes(
  txs: TxFechamento[],
  mes: string,
  topN = 3
): FechamentoMensal {
  const doMes = txs.filter((t) => t.data.slice(0, 7) === mes);
  const anterior = mesAnterior(mes);
  const doAnterior = txs.filter((t) => t.data.slice(0, 7) === anterior);

  const entradas = doMes.filter((t) => t.valor > 0).reduce((s, t) => s + t.valor, 0);
  const gastos = doMes.filter((t) => t.valor < 0);
  const saidas = gastos.reduce((s, t) => s - t.valor, 0);
  const saldo = entradas - saidas;

  const porCategoria = new Map<string, number>();
  for (const t of gastos) {
    const nome = t.categoria ?? "Outros";
    porCategoria.set(nome, (porCategoria.get(nome) ?? 0) - t.valor);
  }
  const topCategorias = [...porCategoria.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([nome, total]) => ({
      nome,
      total: arred(total),
      pct: saidas > 0 ? Math.round((total / saidas) * 1000) / 1000 : 0,
    }));

  const maior = gastos.reduce<TxFechamento | null>(
    (max, t) => (!max || t.valor < max.valor ? t : max),
    null
  );

  const saidasAnterior = doAnterior
    .filter((t) => t.valor < 0)
    .reduce((s, t) => s - t.valor, 0);
  const variacaoGastoPct =
    saidasAnterior > 0
      ? Math.round(((saidas - saidasAnterior) / saidasAnterior) * 1000) / 1000
      : null;

  return {
    mes,
    rotulo: rotuloMes(mes),
    entradas: arred(entradas),
    saidas: arred(saidas),
    saldo: arred(saldo),
    taxaPoupanca: entradas > 0 ? Math.round((saldo / entradas) * 1000) / 1000 : 0,
    numTransacoes: doMes.length,
    topCategorias,
    maiorGasto: maior
      ? { descricao: maior.descricao, valor: arred(-maior.valor) }
      : null,
    variacaoGastoPct,
  };
}

/**
 * Texto do fechamento para WhatsApp (markdown do WhatsApp: *negrito*).
 * `fmt` injetado para manter a lib pura e testável.
 */
export function mensagemFechamento(
  f: FechamentoMensal,
  fmt: (v: number) => string
): string {
  if (f.numTransacoes === 0) {
    return `📅 *Fechamento de ${f.rotulo}*\n\nNão encontrei movimentações nesse mês.`;
  }

  const linhas = [
    `📅 *Fechamento de ${f.rotulo}*`,
    "",
    `📥 Entrou: *${fmt(f.entradas)}*`,
    `📤 Saiu: *${fmt(f.saidas)}*`,
  ];

  if (f.saldo >= 0) {
    const pct = Math.round(f.taxaPoupanca * 100);
    linhas.push(
      `💚 Sobrou: *${fmt(f.saldo)}*${f.entradas > 0 ? ` (${pct}% da sua renda)` : ""}`
    );
  } else {
    linhas.push(`🔴 Faltou: *${fmt(-f.saldo)}* — você gastou mais do que entrou.`);
  }

  if (f.variacaoGastoPct !== null) {
    const p = Math.round(Math.abs(f.variacaoGastoPct) * 100);
    if (p >= 1) {
      linhas.push(
        f.variacaoGastoPct > 0
          ? `📈 Gastou ${p}% mais que no mês anterior.`
          : `📉 Gastou ${p}% menos que no mês anterior. 👏`
      );
    } else {
      linhas.push("➖ Gastos praticamente iguais ao mês anterior.");
    }
  }

  if (f.topCategorias.length > 0) {
    linhas.push("", "*Onde foi o dinheiro:*");
    for (const c of f.topCategorias) {
      linhas.push(`• ${c.nome}: ${fmt(c.total)} (${Math.round(c.pct * 100)}%)`);
    }
  }

  if (f.maiorGasto) {
    linhas.push("", `Maior gasto: ${f.maiorGasto.descricao} — ${fmt(f.maiorGasto.valor)}`);
  }

  return linhas.join("\n");
}
