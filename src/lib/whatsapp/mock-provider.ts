import type { MensagemEnviar, MidiaBase64, WhatsAppProvider } from "./provider";

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
      // Não logar o conteúdo (pode conter saldo/fatura) — só metadados.
      console.log(`[whatsapp:mock] → ${msg.telefone} (${msg.texto.length} chars)`);
    }
    return { ok: true };
  }

  // Sem infraestrutura real não há mídia para baixar.
  async obterMidiaBase64(): Promise<MidiaBase64 | null> {
    return null;
  }
}
