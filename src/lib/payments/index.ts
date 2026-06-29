import type { PaymentsProvider } from "./provider";
import { MockPaymentsProvider } from "./mock-provider";
import { MercadoPagoProvider } from "./mercadopago-provider";

export type {
  PaymentsProvider,
  CheckoutInput,
  CheckoutResultado,
  WebhookEvento,
} from "./provider";

/**
 * Factory do provider de pagamentos — escolhe a implementação por env.
 *
 *   PAYMENTS_PROVIDER=mercadopago + MERCADOPAGO_ACCESS_TOKEN → Mercado Pago real
 *   (qualquer outro caso)                                    → mock
 */
export function getPaymentsProvider(): PaymentsProvider {
  if (process.env.PAYMENTS_PROVIDER === "mercadopago") {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "PAYMENTS_PROVIDER=mercadopago requer MERCADOPAGO_ACCESS_TOKEN."
      );
    }
    return new MercadoPagoProvider(token, process.env.MERCADOPAGO_WEBHOOK_SECRET);
  }
  return new MockPaymentsProvider();
}
