import type { Plano } from "./plans";

/**
 * Contrato de um provider de pagamentos (assinaturas recorrentes).
 *
 * Modelo de checkout hospedado: criamos uma cobrança/preapproval no provider e
 * redirecionamos o usuário para a URL dele; o status real chega depois pelo
 * webhook. Trocar Mercado Pago por Pagar.me/Stripe = trocar a implementação,
 * sem tocar no gating nem na UI.
 *
 * Implementações:
 *  - [mock-provider.ts](./mock-provider.ts) — checkout simulado local.
 *  - [mercadopago-provider.ts](./mercadopago-provider.ts) — stub p/ MP real.
 */

export type CheckoutInput = {
  userId: string;
  payerEmail: string; // Mercado Pago exige o email do pagador no preapproval
  plano: Plano;
  urlSucesso: string;
  urlCancelamento: string;
};

export type CheckoutResultado = {
  url: string; // para onde redirecionar o usuário
  externalId: string; // id da assinatura/preapproval no provider
};

/** Evento normalizado vindo do webhook do provider. */
export type WebhookEvento = {
  tipo: "aprovado" | "cancelado" | "falha_pagamento";
  externalId: string;
  /** Fim do ciclo informado pelo provider (fonte da verdade do faturamento). */
  periodoFim?: string;
};

export interface PaymentsProvider {
  readonly nome: string;
  criarCheckout(input: CheckoutInput): Promise<CheckoutResultado>;
  cancelar(externalId: string): Promise<void>;
  /**
   * Valida e normaliza o webhook; null se inválido/ignorável.
   * Recebe o `Request` inteiro porque a validação da assinatura do Mercado Pago
   * usa o `data.id` da QUERY STRING + headers (`x-signature`, `x-request-id`),
   * e a determinação do status real exige consultar o recurso na API.
   * (rawBody é passado à parte porque o corpo do Request já foi consumido.)
   */
  parseWebhook(
    rawBody: string,
    request: Request
  ): Promise<WebhookEvento | null>;
}
