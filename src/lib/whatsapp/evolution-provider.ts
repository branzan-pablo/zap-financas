import type { MensagemEnviar, MidiaBase64, WhatsAppProvider } from "./provider";

/**
 * Provider Evolution API — envio de WhatsApp (self-hosted via Docker).
 *
 * ⚠️ NÃO TESTADO — depende de uma instância Evolution de pé (infra Docker + número
 * pareado por QR). Implementado conforme a API documentada do Evolution v2:
 *   POST {EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}
 *   header: apikey: {EVOLUTION_API_KEY}
 *   body:   { number: "5511999999999", text: "..." }
 *
 * Só entra com WHATSAPP_PROVIDER=evolution. O webhook inbound da Evolution deve
 * apontar para /api/webhooks/whatsapp (o roteador já lê o formato Evolution).
 *
 * Docs: https://docs.evolutionfoundation.com.br/evolution-api
 */
export class EvolutionWhatsAppProvider implements WhatsAppProvider {
  readonly nome = "evolution";

  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
    private readonly instance: string
  ) {}

  async enviar(msg: MensagemEnviar): Promise<{ ok: boolean; erro?: string }> {
    // Evolution espera o número só com dígitos (código do país incluso).
    const number = msg.telefone.replace(/\D/g, "");
    try {
      const res = await fetch(
        `${this.apiUrl.replace(/\/$/, "")}/message/sendText/${this.instance}`,
        {
          method: "POST",
          headers: { apikey: this.apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ number, text: msg.texto }),
        }
      );
      if (!res.ok) {
        return { ok: false, erro: `Evolution ${res.status}` };
      }
      return { ok: true };
    } catch (e) {
      // Contrato: não lançar por falha de entrega.
      return { ok: false, erro: e instanceof Error ? e.message : "erro de rede" };
    }
  }

  /**
   * Baixa o base64 de uma mensagem de mídia recebida (áudio/imagem):
   *   POST {url}/chat/getBase64FromMediaMessage/{instance}
   *   body { message: { key: { id } }, convertToMp4: false }
   */
  async obterMidiaBase64(messageId: string): Promise<MidiaBase64 | null> {
    try {
      const res = await fetch(
        `${this.apiUrl.replace(/\/$/, "")}/chat/getBase64FromMediaMessage/${this.instance}`,
        {
          method: "POST",
          headers: { apikey: this.apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: { key: { id: messageId } },
            convertToMp4: false,
          }),
        }
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { base64?: string; mimetype?: string };
      if (!data.base64) return null;
      return { base64: data.base64, mimeType: data.mimetype ?? "" };
    } catch {
      return null;
    }
  }
}
