/* eslint-disable @typescript-eslint/no-unused-vars -- stub: params entram quando os métodos forem implementados (Fase 4 real). */
import type {
  CheckoutInput,
  CheckoutResultado,
  PaymentsProvider,
  WebhookEvento,
} from "./provider";

/**
 * Provider Mercado Pago — STUB.
 *
 * Integração real de assinaturas (Pix + cartão recorrente) via Mercado Pago
 * Assinaturas/Preapproval. Será preenchido com:
 *   • criarCheckout → POST /preapproval (devolve init_point)
 *   • cancelar      → PUT /preapproval/{id} { status: "cancelled" }
 *   • parseWebhook  → valida x-signature (HMAC) e consulta o recurso na API
 *
 * Enquanto não há credenciais, `getPaymentsProvider()` devolve o mock; este
 * provider só entra com PAYMENTS_PROVIDER=mercadopago.
 *
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/subscriptions
 */
export class MercadoPagoProvider implements PaymentsProvider {
  readonly nome = "mercadopago";

  constructor(
    private readonly accessToken: string,
    private readonly webhookSecret: string | undefined
  ) {}

  private naoImplementado(metodo: string): never {
    throw new Error(
      `MercadoPagoProvider.${metodo} ainda não implementado — ` +
        `pendente de credenciais Mercado Pago (Fase 4 real).`
    );
  }

  async criarCheckout(input: CheckoutInput): Promise<CheckoutResultado> {
    return this.naoImplementado("criarCheckout");
  }
  async cancelar(externalId: string): Promise<void> {
    return this.naoImplementado("cancelar");
  }
  async parseWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<WebhookEvento | null> {
    return this.naoImplementado("parseWebhook");
  }
}
