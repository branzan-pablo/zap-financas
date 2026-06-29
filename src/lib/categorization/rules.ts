/**
 * Categorização determinística por palavra-chave.
 *
 * Caminho PRIMÁRIO de categorização (custo zero, sem rede). Casos sem match
 * caem no fallback de IA ([../ai](../ai/index.ts)). É uma função PURA — sem
 * I/O — para ser trivialmente testável e reutilizável no servidor.
 *
 * As palavras-chave (`categories.regras`) já vêm normalizadas do seed
 * (minúsculas, sem acento). A descrição da transação é normalizada aqui antes
 * do match por substring.
 */

export type CategoriaRegra = {
  id: string;
  nome: string;
  /** Palavras-chave normalizadas; null/[] = categoria nunca casa por regra. */
  regras: string[] | null;
};

/** minúsculas + remove acentos + colapsa espaços. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacríticos combinantes (U+0300–U+036F)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Devolve o id da PRIMEIRA categoria cuja alguma palavra-chave aparece na
 * descrição, ou null se nenhuma casar. A prioridade é a ordem do array
 * `categorias` (categorias específicas devem vir antes das genéricas).
 */
export function categorizarPorRegras(
  descricao: string,
  categorias: CategoriaRegra[]
): string | null {
  const desc = normalizar(descricao);
  if (!desc) return null;

  for (const cat of categorias) {
    const regras = cat.regras;
    if (!regras || regras.length === 0) continue;
    for (const kw of regras) {
      const termo = normalizar(kw);
      if (termo && desc.includes(termo)) {
        return cat.id;
      }
    }
  }
  return null;
}
