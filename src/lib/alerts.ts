/**
 * Geração de alertas in-app a partir do estado financeiro do usuário.
 *
 * Função PURA e testável (Fase 2 SHOULD — alertas in-app). Sem I/O. Os alertas
 * são DERIVADOS do estado calculado (fatura, limite seguro, duplicatas) — não
 * dependem da tabela `alerts`, que fica reservada para alertas agendados/
 * outbound (WhatsApp/email) da Fase 3.
 */

export type Severidade = "info" | "atencao" | "critico";

export type Alerta = {
  tipo:
    | "fatura_fechando"
    | "limite_atencao"
    | "limite_estouro"
    | "cobranca_duplicada";
  severidade: Severidade;
  titulo: string;
  detalhe: string;
};

export type FaturaResumo = { nome: string; fechamento: string; total: number };

const ORDEM: Record<Severidade, number> = { critico: 0, atencao: 1, info: 2 };

function diffDias(de: Date, ateYmd: string): number {
  const a = new Date(de.getFullYear(), de.getMonth(), de.getDate());
  const b = new Date(ateYmd + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function gerarAlertas(input: {
  faturas: FaturaResumo[];
  limiteStatus: "folga" | "atencao" | "estouro";
  limiteDisponivel: number;
  duplicatas: { descricao: string; valor: number }[];
  hoje: Date;
  diasAviso?: number; // janela p/ "fatura fechando" (default 3)
  fmt: (v: number) => string; // formatador de moeda (injetado)
}): Alerta[] {
  const { faturas, limiteStatus, limiteDisponivel, duplicatas, hoje, fmt } = input;
  const diasAviso = input.diasAviso ?? 3;
  const alertas: Alerta[] = [];

  // Limite seguro do mês.
  if (limiteStatus === "estouro") {
    alertas.push({
      tipo: "limite_estouro",
      severidade: "critico",
      titulo: "Você passou do limite seguro do mês",
      detalhe: `Está ${fmt(-limiteDisponivel)} acima do previsto. Segure os gastos não essenciais.`,
    });
  } else if (limiteStatus === "atencao") {
    alertas.push({
      tipo: "limite_atencao",
      severidade: "atencao",
      titulo: "Seu limite seguro está apertado",
      detalhe: `Restam só ${fmt(limiteDisponivel)} para o mês. Vá com calma.`,
    });
  }

  // Faturas prestes a fechar.
  for (const f of faturas) {
    const dias = diffDias(hoje, f.fechamento);
    if (dias >= 0 && dias <= diasAviso && f.total > 0) {
      alertas.push({
        tipo: "fatura_fechando",
        severidade: "atencao",
        titulo: `Fatura do ${f.nome} fecha ${dias === 0 ? "hoje" : `em ${dias} dia${dias > 1 ? "s" : ""}`}`,
        detalhe: `Valor parcial de ${fmt(f.total)}. Revise antes do fechamento.`,
      });
    }
  }

  // Cobranças duplicadas.
  for (const d of duplicatas) {
    alertas.push({
      tipo: "cobranca_duplicada",
      severidade: "atencao",
      titulo: "Possível cobrança duplicada",
      detalhe: `${d.descricao} aparece mais de uma vez por ${fmt(d.valor)}. Confira.`,
    });
  }

  return alertas.sort((a, b) => ORDEM[a.severidade] - ORDEM[b.severidade]);
}
