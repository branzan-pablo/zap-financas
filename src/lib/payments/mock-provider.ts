import type {
  CheckoutInput,
  CheckoutResultado,
  PaymentsProvider,
  WebhookEvento,
} from "./provider";

/**
 * Provider de pagamentos MOCK — checkout simulado, sem cobrança real.
 *
 * `criarCheckout` devolve uma URL para uma tela de checkout interna
 * (`/checkout/mock`) que simula o pagamento e ativa a assinatura. Permite
 * exercitar todo o fluxo (planos → checkout → ativação → gating) sem Mercado
 * Pago de verdade.
 */
export class MockPaymentsProvider implements PaymentsProvider {
  readonly nome = "mock";

  async criarCheckout(input: CheckoutInput): Promise<CheckoutResultado> {
    const externalId = `mock_${input.userId}_${input.plano.id}`;
    const url = `/checkout/mock?ext=${encodeURIComponent(externalId)}&plano=${input.plano.id}`;
    return { url, externalId };
  }

  async cancelar(): Promise<void> {
    // Nada a fazer no mock.
  }

  async parseWebhook(rawBody: string): Promise<WebhookEvento | null> {
    try {
      const p = JSON.parse(rawBody) as Partial<WebhookEvento>;
      if (!p.externalId || !p.tipo) return null;
      return { tipo: p.tipo, externalId: p.externalId };
    } catch {
      return null;
    }
  }
}
