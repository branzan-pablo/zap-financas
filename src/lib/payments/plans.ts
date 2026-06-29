/**
 * Planos do Zap Finanças — configuração estática (dado puro).
 *
 * Preço de fundador travado para os primeiros usuários (`fundador: true`).
 * O período em meses é usado para calcular a data de fim da assinatura.
 */

export type PlanoId = "mensal" | "trimestral" | "anual";

export type Plano = {
  id: PlanoId;
  nome: string;
  preco: number; // BRL
  meses: number; // duração do ciclo
  periodoLabel: string;
  destaque?: boolean; // melhor custo-benefício
  fundador: boolean;
};

export const PLANOS: Plano[] = [
  {
    id: "mensal",
    nome: "Mensal",
    preco: 19.9,
    meses: 1,
    periodoLabel: "/mês",
    fundador: true,
  },
  {
    id: "trimestral",
    nome: "Trimestral",
    preco: 49.9,
    meses: 3,
    periodoLabel: "/trimestre",
    fundador: true,
  },
  {
    id: "anual",
    nome: "Anual",
    preco: 149.9,
    meses: 12,
    periodoLabel: "/ano",
    destaque: true,
    fundador: true,
  },
];

export function getPlano(id: string): Plano | undefined {
  return PLANOS.find((p) => p.id === id);
}

/** Preço equivalente por mês (para comparar planos). */
export function precoMensalEquivalente(p: Plano): number {
  return Math.round((p.preco / p.meses) * 100) / 100;
}
