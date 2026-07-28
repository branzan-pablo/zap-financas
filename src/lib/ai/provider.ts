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

/** Um gasto extraído de linguagem natural (texto ou áudio). */
export type GastoExtraido = { valor: number; descricao: string };

/**
 * Resultado da NLU sobre uma mensagem livre do usuário (texto ou áudio).
 * `null` (no retorno dos métodos) = IA indisponível/erro — o chamador degrada.
 */
export type InterpretacaoIA =
  | { tipo: "consulta"; alvo: "saldo" | "fatura" | "gastos" | "ajuda" }
  | { tipo: "registrar"; gastos: GastoExtraido[] }
  | { tipo: "nenhum" };

/** Nota fiscal extraída de uma foto (cupom/NFC-e). */
export type NotaFiscalIA = {
  estabelecimento: string;
  /** Total da compra em reais (> 0). */
  total: number;
  /** YYYY-MM-DD quando visível na nota. */
  data?: string;
  itens: { descricao: string; valor: number }[];
};

export interface AIProvider {
  readonly nome: string;
  categorize(
    descricao: string,
    candidatas: CategoriaCandidata[]
  ): Promise<CategorizacaoIA>;

  /** NLU de mensagem livre (WhatsApp). Chamado só quando o regex não resolve. */
  interpretar(texto: string): Promise<InterpretacaoIA | null>;

  /** Interpreta uma mensagem de voz (pode ser gasto OU pergunta). */
  interpretarAudio(
    base64: string,
    mimeType: string
  ): Promise<InterpretacaoIA | null>;

  /** Extrai estabelecimento/total/itens de uma foto de nota fiscal. */
  extrairNotaFiscal(
    base64: string,
    mimeType: string
  ): Promise<NotaFiscalIA | null>;
}
