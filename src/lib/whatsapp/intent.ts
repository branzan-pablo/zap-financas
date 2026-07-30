/**
 * Interpretação de mensagens do WhatsApp → intenção.
 *
 * Parser PURO e testável (determinístico). Cobre os comandos MUST da Fase 3:
 * consultar saldo/fatura/gastos e registrar transação por linguagem natural.
 * Quando o Gemini estiver ligado, dá para adicionar um fallback de NLU para
 * frases fora destes padrões — a interface de Intent já abstrai isso.
 */

import { normalizar } from "../categorization/rules";

export type Intent =
  | { tipo: "saldo" }
  | { tipo: "fatura" }
  | { tipo: "gastos" }
  | { tipo: "fechamento" }
  | { tipo: "registrar"; valor: number; descricao: string }
  | { tipo: "registrar_lote"; itens: { valor: number; descricao: string }[] }
  | { tipo: "ajuda" }
  | { tipo: "desconhecido" };

const VERBOS_GASTO = /\b(gastei|paguei|comprei|gasto|gastar)\b/;

/** Extrai valor (reais) de um trecho: "50", "50,90", "r$ 50.00". */
function extrairValor(texto: string): number | null {
  const m = texto.match(/r?\$?\s*(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
  if (!m) return null;
  // normaliza: remove separador de milhar, troca vírgula decimal por ponto
  const bruto = m[1].replace(/\.(?=\d{3}\b)/g, "").replace(/\s/g, "").replace(",", ".");
  const v = parseFloat(bruto);
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
}

/** Extrai a descrição após preposição: "...em Mercado" → "Mercado". */
function extrairDescricao(texto: string): string {
  const m = texto.match(/\b(?:no|na|em|com|de|do|da|pra|para)\s+(.+)$/);
  const desc = (m ? m[1] : "").trim();
  return desc;
}

export function interpretarMensagem(texto: string): Intent {
  const t = normalizar(texto);
  if (!t) return { tipo: "desconhecido" };

  // Registrar transação: tem verbo de gasto + valor.
  if (VERBOS_GASTO.test(t)) {
    const valor = extrairValor(t);
    if (valor !== null) {
      const descricao = extrairDescricao(t) || "Gasto";
      return { tipo: "registrar", valor, descricao };
    }
  }

  // Antes de "fatura"/"gastos": "fechamento do mês", "resumo do mês passado".
  if (/\bfechamento\b|\bresumo\b|\bbalanco\b|mes passado/.test(t))
    return { tipo: "fechamento" };
  if (/\bfatura\b|\bcartao\b/.test(t)) return { tipo: "fatura" };
  if (/\bsaldo\b|quanto tenho|quanto eu tenho/.test(t)) return { tipo: "saldo" };
  if (/\bgastos?\b|quanto gastei|gasto do mes|extrato/.test(t)) return { tipo: "gastos" };
  if (/\bajuda\b|\bmenu\b|^oi$|^ola$|^\?+$|o que voce faz/.test(t))
    return { tipo: "ajuda" };

  return { tipo: "desconhecido" };
}
