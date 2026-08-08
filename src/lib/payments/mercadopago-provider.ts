import { createHmac, timingSafeEqual } from "node:crypto";
import { fetchComTimeout } from "@/lib/http";
import type {
  CheckoutInput,
  CheckoutResultado,
  PaymentsProvider,
  WebhookEvento,
} from "./provider";
import { WebhookSignatureError } from "./provider";

/**
 * Provider Mercado Pago — Assinaturas (preapproval).
 *
 * ⚠️ NÃO TESTADO CONTRA SANDBOX. Implementado conforme a API documentada do
 * Mercado Pago, mas a documentação oficial é uma SPA que não foi possível ler
 * integralmente pelas ferramentas. ANTES DE PRODUÇÃO, validar contra o sandbox:
 *   1. o template EXATO do manifest da assinatura x-signature (abaixo);
 *   2. os campos do corpo do preapproval e os status retornados;
 *   3. se a recorrência por Pix (Pix Automático) está disponível ou se a
 *      recorrência é só cartão (ver nota em README/ROADMAP).
 *
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/subscriptions
 */

const API = "https://api.mercadopago.com";

type MPPreapproval = {
  status?: string;
  next_payment_date?: string;
  external_reference?: string;
};
type MPAuthorizedPayment = {
  preapproval_id?: string;
  status?: string;
  payment?: { status?: string };
};

export class MercadoPagoProvider implements PaymentsProvider {
  readonly nome = "mercadopago";

  constructor(
    private readonly accessToken: string,
    private readonly webhookSecret: string | undefined
  ) {}

  private async mpFetch(
    path: string,
    init: RequestInit & { idempotencyKey?: string } = {}
  ): Promise<Response> {
    const { idempotencyKey, ...rest } = init;
    return fetchComTimeout(`${API}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
        ...(rest.headers ?? {}),
      },
    });
  }

  /** Credenciais de teste começam com "TEST-" → usar sandbox_init_point. */
  private get sandbox(): boolean {
    return this.accessToken.startsWith("TEST-");
  }

  async criarCheckout(input: CheckoutInput): Promise<CheckoutResultado> {
    const { plano, userId, payerEmail, urlSucesso } = input;

    const res = await this.mpFetch("/preapproval", {
      method: "POST",
      // Idempotência: mesma tentativa de checkout não cria duas assinaturas.
      idempotencyKey: `preapproval_${userId}_${plano.id}`,
      body: JSON.stringify({
        reason: `Zap Finanças — ${plano.nome}`,
        external_reference: userId, // mapeia a assinatura ao nosso usuário
        payer_email: payerEmail,
        back_url: urlSucesso,
        auto_recurring: {
          frequency: plano.meses,
          frequency_type: "months",
          transaction_amount: plano.preco,
          currency_id: "BRL",
        },
        status: "pending",
      }),
    });

    if (!res.ok) {
      throw new Error(`Mercado Pago preapproval falhou: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as {
      id: string;
      init_point?: string;
      sandbox_init_point?: string;
    };
    const url = (this.sandbox ? data.sandbox_init_point : data.init_point) ?? data.init_point;
    if (!url) throw new Error("Mercado Pago não retornou init_point.");

    return { url, externalId: data.id };
  }

  /**
   * Cancela a assinatura no MP.
   *
   * `cancelled` com DOIS "l" — e a documentação oficial diz o contrário.
   *
   * NÃO "corrija" isto para `canceled`. A doc do MP usa `canceled` em 12
   * ocorrências e `cancelled` em nenhuma, mas a API de verdade responde:
   *
   *     PUT /preapproval/{id} {"status":"canceled"}
   *     → 400 {"message":"Invalid preapproval status param: canceled"}
   *
   *     PUT /preapproval/{id} {"status":"cancelled"}
   *     → 200, e o GET seguinte devolve status "cancelled"
   *
   * Verificado em 2026-08-08 contra a API de produção, em duas assinaturas
   * recém-criadas (status `pending`, sem o confundidor de "já cancelada").
   * A troca chegou a ser feita seguindo a doc e foi revertida — o teste em
   * `mercadopago-provider.test.ts` existe para travar a grafia.
   */
  async cancelar(externalId: string): Promise<void> {
    const res = await this.mpFetch(`/preapproval/${externalId}`, {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (!res.ok) {
      throw new Error(`Mercado Pago cancelar falhou: ${res.status} ${await res.text()}`);
    }
  }

  // --- Webhook ---------------------------------------------------------------

  /**
   * Valida a assinatura `x-signature` e resolve o status real consultando a API.
   *
   * ⚠️ TEMPLATE DO MANIFEST — confirmar no sandbox antes de produção:
   *     id:{data.id};request-id:{x-request-id};ts:{ts};
   * onde data.id vem do query param `data.id` da URL (minúsculo se alfanumérico),
   * x-request-id e ts vêm dos headers. HMAC-SHA256(manifest, webhookSecret) em
   * hex, comparado com `v1` do header x-signature.
   */
  async parseWebhook(rawBody: string, request: Request): Promise<WebhookEvento | null> {
    if (!this.assinaturaValida(request)) throw new WebhookSignatureError();

    let body: { type?: string; topic?: string; action?: string; data?: { id?: string } };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const topic = body.type ?? body.topic ?? "";
    // SEGURANÇA: usar o data.id da QUERY (o valor que foi assinado em
    // `assinaturaValida`), não o do corpo (não coberto pela assinatura). Caso
    // contrário um atacante poderia manter a assinatura válida e trocar o
    // body.data.id para agir sobre outro recurso (confused deputy).
    const dataId = new URL(request.url).searchParams.get("data.id") ?? body.data?.id ?? "";
    if (!dataId) return null;

    try {
      // subscription_authorized_payment: cobrança recorrente (sucesso/recusa).
      if (topic.includes("authorized_payment")) {
        const ap = await this.mpGet<MPAuthorizedPayment>(`/authorized_payments/${dataId}`);
        const preapprovalId = String(ap?.preapproval_id ?? "");
        const statusPagamento = ap?.payment?.status ?? ap?.status ?? "";
        if (!preapprovalId) return null;
        if (statusPagamento === "approved" || statusPagamento === "processed") {
          const pre = await this.mpGet<MPPreapproval>(`/preapproval/${preapprovalId}`);
          return {
            tipo: "aprovado",
            externalId: preapprovalId,
            periodoFim: pre?.next_payment_date,
            externalReference: pre?.external_reference,
          };
        }
        return { tipo: "falha_pagamento", externalId: preapprovalId };
      }

      // subscription_preapproval: estado da assinatura mudou.
      if (topic.includes("preapproval")) {
        const pre = await this.mpGet<MPPreapproval>(`/preapproval/${dataId}`);
        const status = pre?.status ?? "";
        if (status === "authorized") {
          return {
            tipo: "aprovado",
            externalId: dataId,
            periodoFim: pre?.next_payment_date,
            externalReference: pre?.external_reference,
          };
        }
        // Aceita as duas grafias na LEITURA de propósito. A API devolve
        // `cancelled` hoje (verificado), mas a documentação deles diz
        // `canceled` — quando as duas discordam, o dia em que a API se alinhar
        // à doc não pode ser o dia em que os cancelamentos somem em silêncio.
        // Estrito ao escrever (uma grafia funciona), tolerante ao ler.
        if (status === "cancelled" || status === "canceled") {
          return { tipo: "cancelado", externalId: dataId };
        }
        return null; // pending/paused → sem ação
      }

      return null;
    } catch {
      // Falha ao consultar a API → não age (MP reenvia o webhook depois).
      return null;
    }
  }

  private async mpGet<T>(path: string): Promise<T | null> {
    const res = await this.mpFetch(path);
    if (!res.ok) return null;
    return (await res.json()) as T;
  }

  private assinaturaValida(request: Request): boolean {
    if (!this.webhookSecret) return false; // sem secret não há como validar
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id") ?? "";
    if (!xSignature) return false;

    // x-signature: "ts=...,v1=..."
    const partes = Object.fromEntries(
      xSignature.split(",").map((kv) => {
        const [k, v] = kv.split("=");
        return [k?.trim(), v?.trim()];
      })
    );
    const ts = partes["ts"];
    const v1 = partes["v1"];
    if (!ts || !v1) return false;

    const dataId = (new URL(request.url).searchParams.get("data.id") ?? "").toLowerCase();
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const esperado = createHmac("sha256", this.webhookSecret).update(manifest).digest("hex");

    const a = Buffer.from(esperado);
    const b = Buffer.from(v1);
    const ok = a.length === b.length && timingSafeEqual(a, b);
    if (!ok) {
      // Observabilidade: se a assinatura não confere, logamos os componentes
      // (nada sensível) para diagnosticar formato do manifest vs. o que o MP envia.
      console.warn(
        `mercadopago webhook: x-signature não confere ` +
          `(dataId="${dataId}" reqId="${xRequestId}" tsPresente=${!!ts})`
      );
    }
    return ok;
  }
}
