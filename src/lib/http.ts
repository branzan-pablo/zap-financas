/**
 * Timeouts para chamadas a APIs externas (Pluggy, Mercado Pago, Gemini, Evolution).
 *
 * Sem `signal`, um `fetch` fica pendurado até o limite da serverless function da
 * Vercel. Nos crons isso é pior que lento: o de sync percorre todos os usuários
 * em série, então uma única instituição fora do ar derruba a execução inteira e
 * ninguém mais é sincronizado naquele dia.
 *
 * O timeout aborta o socket e devolve o controle para o chamador, que já sabe
 * lidar com falha (o sync conta em `falhas`, o provider de WhatsApp devolve
 * `{ok:false}`, o webhook do MP não age e deixa o provider reenviar).
 */

/** Chamada de API comum. Generoso o bastante para cold start do outro lado. */
export const TIMEOUT_PADRAO_MS = 15_000;

/**
 * Operações de IA (transcrição de áudio, OCR de nota fiscal) — o modelo
 * multimodal leva mais tempo que um REST comum.
 */
export const TIMEOUT_IA_MS = 30_000;

/**
 * `fetch` com timeout. Compõe com um `signal` já existente, se houver, para não
 * descartar o cancelamento de quem chamou.
 *
 * Em timeout o `fetch` rejeita com `TimeoutError` — mesmo caminho de erro de
 * qualquer falha de rede, então nenhum chamador precisa de tratamento especial.
 */
export function fetchComTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = TIMEOUT_PADRAO_MS
): Promise<Response> {
  const timeout = AbortSignal.timeout(timeoutMs);
  return fetch(input, {
    ...init,
    signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
  });
}
