import type { WhatsAppProvider } from "./provider";
import { MockWhatsAppProvider } from "./mock-provider";
import { EvolutionWhatsAppProvider } from "./evolution-provider";

export type { WhatsAppProvider, MensagemEnviar } from "./provider";

/**
 * Factory do provider de WhatsApp — escolhe a implementação por env.
 * Mesma filosofia das demais camadas: real quando configurado, mock caso contrário.
 *
 *   WHATSAPP_PROVIDER=evolution + EVOLUTION_API_URL/KEY/INSTANCE → Evolution real
 *   (qualquer outro caso)                                        → mock
 */
export function getWhatsAppProvider(): WhatsAppProvider {
  if (process.env.WHATSAPP_PROVIDER === "evolution") {
    const url = process.env.EVOLUTION_API_URL;
    const key = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE;
    if (!url || !key || !instance) {
      throw new Error(
        "WHATSAPP_PROVIDER=evolution requer EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE."
      );
    }
    return new EvolutionWhatsAppProvider(url, key, instance);
  }
  return new MockWhatsAppProvider();
}
