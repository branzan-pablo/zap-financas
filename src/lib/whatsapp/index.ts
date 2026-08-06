import type { WhatsAppProvider } from "./provider";
import { MockWhatsAppProvider } from "./mock-provider";
import { EvolutionWhatsAppProvider } from "./evolution-provider";

export type { WhatsAppProvider, MensagemEnviar } from "./provider";

/**
 * Factory do provider de WhatsApp — escolhe a implementação por env.
 *
 *   WHATSAPP_PROVIDER=evolution + EVOLUTION_API_URL/KEY/INSTANCE → Evolution real
 *   (qualquer outro caso, fora de produção)                      → mock
 *
 * ⚠️ FAIL CLOSED EM PRODUÇÃO. O mock só escreve no log — não entrega nada. Cair
 * nele em produção faria o app engolir alertas, fechamentos e respostas do
 * assistente sem qualquer sinal de erro. O WhatsApp é o canal principal do
 * produto: falhar alto é melhor que falhar mudo.
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

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Em produção, WHATSAPP_PROVIDER precisa ser 'evolution'. " +
        "O provider mock não entrega mensagens e nunca pode rodar em produção."
    );
  }

  return new MockWhatsAppProvider();
}
