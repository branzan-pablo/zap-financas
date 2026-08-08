import { describe, it, expect, vi, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { MercadoPagoProvider } from "./mercadopago-provider";

/**
 * Testes de contrato com a API do Mercado Pago.
 *
 * O foco é a grafia de `cancelled`, onde a API e a documentação do MP
 * DISCORDAM. A doc usa `canceled` (um "l") em 12 ocorrências e `cancelled` em
 * nenhuma; a API faz o oposto. Verificado em 2026-08-08, em produção, contra
 * duas assinaturas `pending`:
 *
 *     {"status":"canceled"}  → 400 "Invalid preapproval status param: canceled"
 *     {"status":"cancelled"} → 200, GET seguinte devolve "cancelled"
 *
 * Alguém já "corrigiu" isto para `canceled` seguindo a doc, e o modo de falha é
 * silencioso: o usuário cancela em /assinar, o MP recusa, e `cancelarAssinatura`
 * marca "cancelado" no nosso banco de qualquer forma — tela diz que acabou, a
 * cobrança continua. O teste abaixo é o que impede a próxima tentativa.
 */

const SECRET = "segredo-de-teste";

function respostaOk(corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/** Monta uma requisição de webhook assinada como o MP assina. */
function requisicaoAssinada(dataId: string) {
  const ts = "1700000000";
  const requestId = "req-abc";
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", SECRET).update(manifest).digest("hex");
  return new Request(
    `https://zapfinancas.com.br/api/webhooks/mercadopago?data.id=${dataId}`,
    { headers: { "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": requestId } }
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("cancelar", () => {
  it('envia status "cancelled" — dois "l", como a API exige (a doc mente)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaOk({}));
    vi.stubGlobal("fetch", fetchMock);

    await new MercadoPagoProvider("TEST-token", SECRET).cancelar("preapp-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.mercadopago.com/preapproval/preapp-1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ status: "cancelled" });
  });

  it("propaga falha do MP em vez de engolir", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 400 }))
    );

    await expect(
      new MercadoPagoProvider("TEST-token", SECRET).cancelar("preapp-1")
    ).rejects.toThrow(/400/);
  });
});

describe("parseWebhook — status da assinatura", () => {
  // Lê as duas grafias: a API devolve "cancelled" hoje, mas a doc deles diz
  // "canceled". O dia em que a API se alinhar à doc não pode ser o dia em que
  // os cancelamentos param de ser processados.
  it.each(["cancelled", "canceled"])(
    'mapeia status "%s" para tipo cancelado',
    async (status) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaOk({ status })));

      const evento = await new MercadoPagoProvider("TEST-token", SECRET).parseWebhook(
        JSON.stringify({ type: "subscription_preapproval", data: { id: "preapp-9" } }),
        requisicaoAssinada("preapp-9")
      );

      expect(evento).toEqual({ tipo: "cancelado", externalId: "preapp-9" });
    }
  );

  it('mapeia "authorized" para aprovado, com o periodoFim vindo do MP', async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respostaOk({ status: "authorized", next_payment_date: "2026-09-08T00:00:00Z" })
      )
    );

    const evento = await new MercadoPagoProvider("TEST-token", SECRET).parseWebhook(
      JSON.stringify({ type: "subscription_preapproval", data: { id: "preapp-9" } }),
      requisicaoAssinada("preapp-9")
    );

    expect(evento).toEqual({
      tipo: "aprovado",
      externalId: "preapp-9",
      periodoFim: "2026-09-08T00:00:00Z",
    });
  });

  it("não age em pending", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaOk({ status: "pending" })));

    const evento = await new MercadoPagoProvider("TEST-token", SECRET).parseWebhook(
      JSON.stringify({ type: "subscription_preapproval", data: { id: "preapp-9" } }),
      requisicaoAssinada("preapp-9")
    );

    expect(evento).toBeNull();
  });
});
