/**
 * Contrato de um provider de WhatsApp (envio de mensagens outbound).
 *
 * Toda implementação (mock, Evolution API, Cloud API oficial) cumpre esta
 * interface — trocar de fornecedor não toca no roteador de mensagens nem nos
 * alertas. Mock-first enquanto a Evolution API (Docker self-host) não está de pé.
 *
 * Implementações:
 *  - [mock-provider.ts](./mock-provider.ts) — não envia de verdade (dev/testes).
 *  - [evolution-provider.ts](./evolution-provider.ts) — stub p/ Evolution API.
 */

export type MensagemEnviar = {
  telefone: string; // E.164, ex.: +5511999999999
  texto: string;
};

export interface WhatsAppProvider {
  readonly nome: string;
  /** Envia uma mensagem de texto. Não deve lançar por falha de entrega: retorna ok=false. */
  enviar(msg: MensagemEnviar): Promise<{ ok: boolean; erro?: string }>;
}
