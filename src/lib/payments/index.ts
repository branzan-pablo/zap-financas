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
 *   (qualquer outro caso, fora de produção)                  → mock
 *
 * ⚠️ FAIL CLOSED EM PRODUÇÃO. O provider mock não cobra nada e destrava o
 * checkout simulado (/checkout/mock), que ativa assinatura sem pagamento. Se
 * PAYMENTS_PROVIDER faltasse ou viesse com typo em produção, o fallback para
 * mock transformaria a rota numa máquina de assinaturas grátis. Por isso, em
 * produção, o mock é um erro — não um default.
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

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Em produção, PAYMENTS_PROVIDER precisa ser 'mercadopago'. " +
        "O provider mock ativa assinatura sem cobrar e nunca pode rodar em produção."
    );
  }

  return new MockPaymentsProvider();
}
