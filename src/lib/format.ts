/** Formatação BR — moeda e datas. Reutilizado pelas telas financeiras. */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um número como Real brasileiro (ex.: 1234.5 → "R$ 1.234,50"). */
export function formatBRL(valor: number | null | undefined): string {
  return BRL.format(valor ?? 0);
}

const DATA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

/** Formata uma data ISO/`YYYY-MM-DD` como "28 jun". */
export function formatData(iso: string): string {
  // Datas 'YYYY-MM-DD' não têm fuso — interpretar como local evita -1 dia.
  const d = iso.length === 10 ? new Date(iso + "T12:00:00") : new Date(iso);
  return DATA.format(d);
}
