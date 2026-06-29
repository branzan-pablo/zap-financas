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
};

export interface PaymentsProvider {
  readonly nome: string;
  criarCheckout(input: CheckoutInput): Promise<CheckoutResultado>;
  cancelar(externalId: string): Promise<void>;
  /** Valida e normaliza o payload do webhook; null se inválido/ignorável. */
  parseWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<WebhookEvento | null>;
}
