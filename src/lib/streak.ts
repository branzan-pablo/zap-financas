/**
 * Sequência de dias registrando gastos (Fase 6 P2 — gamificação leve).
 *
 * Função PURA e testável. A sequência é DERIVADA dos lançamentos que o próprio
 * usuário fez (WhatsApp ou manual) — nada de tabela de "pontos" para manter em
 * sincronia. Registros do Open Finance não contam: eles chegam sozinhos, não
 * representam o hábito que queremos incentivar.
 *
 * Regra: a sequência continua viva se houve registro HOJE ou ONTEM — assim quem
 * ainda não lançou nada hoje não vê a sequência zerada às 8 da manhã.
 */

export type Streak = {
  /** Dias consecutivos até hoje (0 = sequência perdida). */
  atual: number;
  /** Maior sequência já alcançada. */
  recorde: number;
  registrouHoje: boolean;
  /** Total de dias distintos com registro. */
  totalDias: number;
};

const DIA = 86_400_000;

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Diferença em dias entre duas datas YYYY-MM-DD (a - b). */
function diffDias(a: string, b: string): number {
  return Math.round(
    (new Date(a + "T00:00:00").getTime() - new Date(b + "T00:00:00").getTime()) / DIA
  );
}

export function calcularStreak(datas: string[], hoje: Date = new Date()): Streak {
  const dias = [...new Set(datas.map((d) => d.slice(0, 10)))].sort(); // asc
  if (dias.length === 0) {
    return { atual: 0, recorde: 0, registrouHoje: false, totalDias: 0 };
  }

  const hojeStr = ymd(hoje);
  const registrouHoje = dias.includes(hojeStr);

  // Maior sequência (percorre em ordem crescente).
  let recorde = 1;
  let corrente = 1;
  for (let i = 1; i < dias.length; i++) {
    corrente = diffDias(dias[i], dias[i - 1]) === 1 ? corrente + 1 : 1;
    if (corrente > recorde) recorde = corrente;
  }

  // Sequência atual: conta de trás para frente a partir de hoje/ontem.
  const ultimo = dias[dias.length - 1];
  const distancia = diffDias(hojeStr, ultimo);
  let atual = 0;
  if (distancia <= 1) {
    atual = 1;
    for (let i = dias.length - 1; i > 0; i--) {
      if (diffDias(dias[i], dias[i - 1]) === 1) atual++;
      else break;
    }
  }

  return { atual, recorde, registrouHoje, totalDias: dias.length };
}

/** Marcos que valem uma comemoração (evita elogiar todo dia). */
const MARCOS = [3, 7, 14, 30, 60, 100, 365];

/**
 * Mensagem curta de incentivo — só em marcos, para não virar spam.
 * Retorna null quando não há nada digno de comemorar.
 */
export function mensagemStreak(s: Streak): string | null {
  if (!MARCOS.includes(s.atual)) return null;
  if (s.atual === s.recorde && s.atual > 3) {
    return `🔥 ${s.atual} dias seguidos registrando — seu novo recorde!`;
  }
  return `🔥 ${s.atual} dias seguidos registrando. Continue assim!`;
}
