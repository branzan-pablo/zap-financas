/**
 * Contrato de um provider de IA para o app.
 *
 * Hoje cobre apenas categorização de transações (fallback dos casos que as
 * regras determinísticas não resolvem). À medida que a Fase 2/3 avançarem
 * (Q&A financeiro, parsing de mensagens WhatsApp), novos métodos entram aqui.
 *
 * Implementações:
 *  - [gemini-provider.ts](./gemini-provider.ts) — Google Gemini via REST.
 *  - [mock-provider.ts](./mock-provider.ts) — heurístico local, sem rede.
 */

export type CategoriaCandidata = { id: string; nome: string };

export type CategorizacaoIA = {
  /** id da categoria escolhida, ou null se a IA não tiver confiança. */
  categoriaId: string | null;
  /** 0..1 — usado para auditoria/threshold futuro. */
  confianca: number;
};

export interface AIProvider {
  readonly nome: string;
  categorize(
    descricao: string,
    candidatas: CategoriaCandidata[]
  ): Promise<CategorizacaoIA>;
}
