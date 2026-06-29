/* eslint-disable @typescript-eslint/no-unused-vars -- stub: params entram quando o método for implementado (Fase 3 real). */
import type { MensagemEnviar, WhatsAppProvider } from "./provider";

/**
 * Provider Evolution API — STUB.
 *
 * Integração real de WhatsApp (Evolution API self-hosted via Docker, Fase 3
 * real). Será preenchido com a chamada de envio:
 *   POST {EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}
 *   header: apikey: {EVOLUTION_API_KEY}
 *
 * Enquanto não há instância de pé, `getWhatsAppProvider()` devolve o mock; este
 * provider só entra com WHATSAPP_PROVIDER=evolution.
 *
 * Docs: https://doc.evolution-api.com/
 */
export class EvolutionWhatsAppProvider implements WhatsAppProvider {
  readonly nome = "evolution";

  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
    private readonly instance: string
  ) {}

  async enviar(_msg: MensagemEnviar): Promise<{ ok: boolean; erro?: string }> {
    throw new Error(
      "EvolutionWhatsAppProvider.enviar ainda não implementado — " +
        "pendente de instância Evolution API (Fase 3 real)."
    );
  }
}
