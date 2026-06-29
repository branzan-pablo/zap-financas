/**
 * Detecção de assinaturas recorrentes e cobranças duplicadas.
 *
 * Funções PURAS e testáveis (Fase 2 — insights). Sem I/O. Heurísticas
 * determinísticas sobre o histórico de transações; reutilizam `normalizar`
 * para agrupar descrições com grafias/acentos diferentes.
 */

import { normalizar } from "./categorization/rules";

export type TxInsight = {
  descricao: string;
  valor: number; // negativo = débito
  data: string; // YYYY-MM-DD
};

export type Assinatura = {
  descricao: string; // descrição representativa (a mais recente)
  valorMedio: number; // valor médio (positivo)
  ocorrencias: number;
  ultimaData: string;
};

export type Duplicata = {
  descricao: string;
  valor: number; // valor (positivo) cobrado em duplicidade
  datas: string[]; // datas das cobranças próximas
};

function anoMes(data: string): string {
  return data.slice(0, 7); // YYYY-MM
}

function diffDias(a: string, b: string): number {
  const ms = new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime();
  return Math.abs(Math.round(ms / 86_400_000));
}

/**
 * Detecta assinaturas: mesmo estabelecimento, valor ~fixo, recorrente em
 * meses distintos. Considera só débitos.
 *
 * @param minOcorrencias mínimo de cobranças p/ considerar assinatura (default 2)
 * @param tolerancia     variação máxima de valor aceita (default 0.15 = 15%)
 */
export function detectarAssinaturas(
  txs: TxInsight[],
  minOcorrencias = 2,
  tolerancia = 0.15
): Assinatura[] {
  const grupos = new Map<string, TxInsight[]>();
  for (const t of txs) {
    if (t.valor >= 0) continue; // só débitos
    const chave = normalizar(t.descricao);
    if (!chave) continue;
    (grupos.get(chave) ?? grupos.set(chave, []).get(chave)!).push(t);
  }

  const assinaturas: Assinatura[] = [];
  for (const grupo of grupos.values()) {
    const meses = new Set(grupo.map((t) => anoMes(t.data)));
    if (grupo.length < minOcorrencias || meses.size < minOcorrencias) continue;

    const valores = grupo.map((t) => Math.abs(t.valor));
    const media = valores.reduce((s, v) => s + v, 0) / valores.length;
    const desvioMax = Math.max(...valores.map((v) => Math.abs(v - media)));
    // valor precisa ser aproximadamente fixo
    if (media === 0 || desvioMax / media > tolerancia) continue;

    const maisRecente = grupo.reduce((a, b) => (a.data >= b.data ? a : b));
    assinaturas.push({
      descricao: maisRecente.descricao,
      valorMedio: Math.round(media * 100) / 100,
      ocorrencias: grupo.length,
      ultimaData: maisRecente.data,
    });
  }

  return assinaturas.sort((a, b) => b.valorMedio - a.valorMedio);
}

/**
 * Detecta cobranças duplicadas: mesmo estabelecimento e mesmo valor cobrados
 * dentro de uma janela curta de dias.
 *
 * @param janelaDias intervalo máximo entre cobranças "duplicadas" (default 4)
 */
export function detectarDuplicatas(
  txs: TxInsight[],
  janelaDias = 4
): Duplicata[] {
  // Agrupa por descrição + valor (centavos) — só débitos.
  const grupos = new Map<string, TxInsight[]>();
  for (const t of txs) {
    if (t.valor >= 0) continue;
    const chave = `${normalizar(t.descricao)}::${Math.round(Math.abs(t.valor) * 100)}`;
    (grupos.get(chave) ?? grupos.set(chave, []).get(chave)!).push(t);
  }

  const duplicatas: Duplicata[] = [];
  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue;
    const ordenado = [...grupo].sort((a, b) => a.data.localeCompare(b.data));

    // Coleta cobranças consecutivas dentro da janela.
    const proximas: string[] = [];
    for (let i = 1; i < ordenado.length; i++) {
      if (diffDias(ordenado[i - 1].data, ordenado[i].data) <= janelaDias) {
        if (!proximas.includes(ordenado[i - 1].data)) proximas.push(ordenado[i - 1].data);
        proximas.push(ordenado[i].data);
      }
    }
    if (proximas.length >= 2) {
      duplicatas.push({
        descricao: ordenado[0].descricao,
        valor: Math.round(Math.abs(ordenado[0].valor) * 100) / 100,
        datas: proximas,
      });
    }
  }

  return duplicatas.sort((a, b) => b.valor - a.valor);
}
