import { describe, it, expect, vi, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { MercadoPagoProvider } from "./mercadopago-provider";

/**
 * Testes de contrato com a API do Mercado Pago.
 *
 * O foco é a grafia de `canceled`: a API aceita UM "l" e o código enviava dois.
 * O bug não aparecia em teste nenhum e o modo de falha era silencioso — usuário
 * cancela, o banco marca "cancelado", e o MP segue cobrando. Um teste que trave
 * a string é barato perto disso.
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
  it('envia status "canceled" — um "l", como a API exige', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaOk({}));
    vi.stubGlobal("fetch", fetchMock);

    await new MercadoPagoProvider("TEST-token", SECRET).cancelar("preapp-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.mercadopago.com/preapproval/preapp-1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ status: "canceled" });
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
  // Lê as duas grafias: quem escolhe a palavra na resposta é o MP, e uma troca
  // do lado deles faria o cancelamento sumir sem ninguém perceber.
  it.each(["canceled", "cancelled"])(
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
