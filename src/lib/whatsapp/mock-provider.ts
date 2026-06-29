import type { MensagemEnviar, WhatsAppProvider } from "./provider";

/**
 * Provider de WhatsApp MOCK — não envia de verdade.
 *
 * Usado enquanto a Evolution API não está self-hosted. Apenas registra a
 * mensagem (em dev) e retorna ok. O roteador inbound devolve a resposta também
 * no corpo HTTP, então dá para validar o fluxo ponta a ponta sem WhatsApp real.
 */
export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly nome = "mock";

  async enviar(msg: MensagemEnviar): Promise<{ ok: boolean }> {
    if (process.env.NODE_ENV !== "production") {
      // Sem dados financeiros sensíveis além do que o próprio usuário pediu.
      console.log(`[whatsapp:mock] → ${msg.telefone}: ${msg.texto.slice(0, 80)}`);
    }
    return { ok: true };
  }
}
