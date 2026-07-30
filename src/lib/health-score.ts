/**
 * Score de saúde financeira (Fase 6 P2) — 0 a 100, função PURA e testável.
 *
 * Combina sinais que o app JÁ calcula (poupança do mês, reserva, peso da fatura,
 * disciplina de orçamento, assinaturas, cobranças duplicadas) numa nota única com
 * explicação. Concorrentes cobram por isso; aqui é derivado do que já existe.
 *
 * Princípio de honestidade: componente que NÃO pode ser avaliado com os dados
 * disponíveis (ex.: sem renda registrada, ou sem orçamento definido) não vira
 * nota baixa — ele sai da conta e seu peso é redistribuído entre os demais.
 * Assim a nota nunca pune o usuário por uma informação que ele não deu.
 */

export type NivelSaude = "critico" | "atencao" | "bom" | "excelente";

export type ComponenteScore = {
  chave:
    | "poupanca"
    | "reserva"
    | "cartao"
    | "orcamentos"
    | "assinaturas"
    | "desperdicio";
  nome: string;
  /** 0..1 — desempenho no componente. */
  nota: number;
  /** Peso efetivo em pontos (já redistribuído). */
  peso: number;
  detalhe: string;
};

export type ScoreSaude = {
  /** 0..100 (inteiro). */
  score: number;
  nivel: NivelSaude;
  componentes: ComponenteScore[];
  /** Ações sugeridas, das mais impactantes para as menos. */
  dicas: string[];
};

export type EntradaScore = {
  rendaMes: number;
  gastoMes: number;
  saldoContas: number;
  totalInvestido: number;
  faturaTotal: number;
  custoAssinaturas: number;
  numDuplicatas: number;
  orcamentos: { status: "ok" | "atencao" | "estouro" }[];
};

const PESOS = {
  poupanca: 30,
  reserva: 25,
  cartao: 15,
  orcamentos: 15,
  assinaturas: 10,
  desperdicio: 5,
} as const;

/** Interpola 0..1 entre `ruim` e `bom` (aceita escala invertida). */
function faixa(valor: number, ruim: number, bom: number): number {
  if (ruim === bom) return 1;
  const t = (valor - ruim) / (bom - ruim);
  return Math.max(0, Math.min(1, t));
}

export function calcularScore(e: EntradaScore): ScoreSaude {
  const temRenda = e.rendaMes > 0;
  const temGasto = e.gastoMes > 0;
  const temOrcamento = e.orcamentos.length > 0;

  // Cada avaliável entra com { nota, peso }; os não avaliáveis ficam de fora.
  const avaliaveis: ComponenteScore[] = [];

  // 1. Poupança do mês — quanto sobrou da renda. 0% ruim, 20%+ ótimo.
  if (temRenda) {
    const taxa = (e.rendaMes - e.gastoMes) / e.rendaMes;
    avaliaveis.push({
      chave: "poupanca",
      nome: "Sobra no mês",
      nota: faixa(taxa, 0, 0.2),
      peso: PESOS.poupanca,
      detalhe:
        taxa < 0
          ? "Você gastou mais do que entrou neste mês."
          : `Sobrou ${Math.round(taxa * 100)}% da sua renda.`,
    });
  }

  // 2. Reserva — quantos meses de gasto o dinheiro guardado cobre. 6 meses = ótimo.
  if (temGasto) {
    const meses = (e.saldoContas + e.totalInvestido) / e.gastoMes;
    avaliaveis.push({
      chave: "reserva",
      nome: "Reserva de emergência",
      nota: faixa(meses, 0, 6),
      peso: PESOS.reserva,
      detalhe: `Seu dinheiro guardado cobre ${meses.toFixed(1)} ${
        meses === 1 ? "mês" : "meses"
      } de gasto.`,
    });
  }

  // 3. Peso do cartão — fatura sobre a renda. Até 20% ótimo, 60%+ crítico.
  if (temRenda) {
    const peso = e.faturaTotal / e.rendaMes;
    avaliaveis.push({
      chave: "cartao",
      nome: "Peso do cartão",
      nota: faixa(peso, 0.6, 0.2),
      peso: PESOS.cartao,
      detalhe: `A fatura aberta é ${Math.round(peso * 100)}% da sua renda.`,
    });
  }

  // 4. Disciplina de orçamento — só avalia quem definiu orçamento.
  if (temOrcamento) {
    const ok = e.orcamentos.filter((o) => o.status === "ok").length;
    const estourados = e.orcamentos.filter((o) => o.status === "estouro").length;
    avaliaveis.push({
      chave: "orcamentos",
      nome: "Orçamentos respeitados",
      nota: ok / e.orcamentos.length,
      peso: PESOS.orcamentos,
      detalhe:
        estourados > 0
          ? `${estourados} de ${e.orcamentos.length} orçamentos estourados.`
          : `${ok} de ${e.orcamentos.length} orçamentos dentro do limite.`,
    });
  }

  // 5. Assinaturas — recorrentes sobre a renda. Até 5% ótimo, 20%+ pesado.
  if (temRenda) {
    const peso = e.custoAssinaturas / e.rendaMes;
    avaliaveis.push({
      chave: "assinaturas",
      nome: "Peso das assinaturas",
      nota: faixa(peso, 0.2, 0.05),
      peso: PESOS.assinaturas,
      detalhe: `Assinaturas consomem ${Math.round(peso * 100)}% da sua renda.`,
    });
  }

  // 6. Desperdício — cobranças duplicadas detectadas.
  avaliaveis.push({
    chave: "desperdicio",
    nome: "Cobranças duplicadas",
    nota: e.numDuplicatas === 0 ? 1 : Math.max(0, 1 - e.numDuplicatas * 0.5),
    peso: PESOS.desperdicio,
    detalhe:
      e.numDuplicatas === 0
        ? "Nenhuma cobrança duplicada detectada."
        : `${e.numDuplicatas} possível(is) cobrança(s) duplicada(s).`,
  });

  // Redistribui o peso dos componentes que ficaram de fora.
  const pesoBruto = avaliaveis.reduce((s, c) => s + c.peso, 0);
  const fator = pesoBruto > 0 ? 100 / pesoBruto : 0;
  const componentes = avaliaveis.map((c) => ({
    ...c,
    peso: Math.round(c.peso * fator * 10) / 10,
  }));

  const score = Math.round(
    componentes.reduce((s, c) => s + c.nota * c.peso, 0)
  );

  // Dicas: componentes mais fracos primeiro, ponderados pelo peso (o que mais
  // move a nota vem antes).
  const dicas = [...componentes]
    .filter((c) => c.nota < 0.75)
    .sort((a, b) => (1 - a.nota) * a.peso - (1 - b.nota) * b.peso)
    .reverse()
    .slice(0, 3)
    .map((c) => DICAS[c.chave]);

  return { score, nivel: nivelDe(score), componentes, dicas };
}

const DICAS: Record<ComponenteScore["chave"], string> = {
  poupanca:
    "Tente fechar o mês gastando menos do que entra — comece cortando a maior categoria.",
  reserva:
    "Monte uma reserva até cobrir 6 meses de gasto; guarde um valor fixo assim que a renda cai.",
  cartao:
    "Sua fatura está alta para a renda. Evite novos parcelamentos até ela baixar.",
  orcamentos:
    "Você está estourando orçamentos. Reveja os limites ou ajuste os gastos da categoria.",
  assinaturas:
    "Revise as assinaturas: cancele o que você não usou no último mês.",
  desperdicio:
    "Confira as cobranças duplicadas — pode ser dinheiro saindo duas vezes pelo mesmo serviço.",
};

export function nivelDe(score: number): NivelSaude {
  if (score >= 80) return "excelente";
  if (score >= 60) return "bom";
  if (score >= 40) return "atencao";
  return "critico";
}

export const NIVEL_LABEL: Record<NivelSaude, string> = {
  excelente: "Excelente",
  bom: "Boa",
  atencao: "Atenção",
  critico: "Crítica",
};
