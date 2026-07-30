import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Testes de integração do webhook inbound do WhatsApp.
 *
 * Cobrem o que NÃO dá para validar sem um número pareado: o roteamento de
 * payloads reais da Evolution (texto, áudio, imagem), as regras de silêncio
 * (grupo / remetente desconhecido) e a ordem de segurança (mídia só é baixada
 * DEPOIS de confirmar o vínculo). Supabase, provider de WhatsApp, IA e o handler
 * são dublês — aqui o objeto de teste é a decisão do webhook, não a matemática
 * financeira (essa tem os testes puros das libs).
 */

const SECRET = "segredo-de-teste";

// --- Dublês ------------------------------------------------------------------

type LinkRow = { user_id: string } | null;

let pendente: LinkRow; // linha de pareamento pendente (por código)
let link: LinkRow; // vínculo ativo (por telefone)
let updates: { vals: Record<string, unknown> }[];
let updateError: { message: string } | null;

function fakeDb() {
  const build = () => {
    const filtros: Record<string, unknown> = {};
    const b = {
      select: () => b,
      update: (vals: Record<string, unknown>) => {
        updates.push({ vals });
        return b;
      },
      eq: (col: string, val: unknown) => {
        filtros[col] = val;
        return b;
      },
      gt: (col: string, val: unknown) => {
        filtros[col] = val;
        return b;
      },
      maybeSingle: async () =>
        filtros.codigo_pareamento ? { data: pendente } : { data: link },
      // `await db.from(...).update(...).eq(...)` precisa ser aguardável.
      then: (resolve: (v: { error: unknown }) => void) =>
        resolve({ error: updateError }),
    };
    return b;
  };
  return { from: () => build() };
}

const enviar = vi.fn(async () => ({ ok: true }));
const obterMidiaBase64 = vi.fn<
  () => Promise<{ base64: string; mimeType: string } | null>
>(async () => ({ base64: "QUJD", mimeType: "audio/ogg; codecs=opus" }));

const interpretar = vi.fn();
const interpretarAudio = vi.fn();
const extrairNotaFiscal = vi.fn();

const responderIntent = vi.fn(
  async (_db: unknown, _userId: string, intent: { tipo: string }) =>
    `INTENT:${intent.tipo}`
);

vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => fakeDb() }));
vi.mock("@/lib/whatsapp", () => ({
  getWhatsAppProvider: () => ({ nome: "fake", enviar, obterMidiaBase64 }),
}));
vi.mock("@/lib/ai", () => ({
  getAIProvider: () => ({ interpretar, interpretarAudio, extrairNotaFiscal }),
}));
vi.mock("@/lib/whatsapp/handler", () => ({
  responderIntent: (...args: unknown[]) =>
    (responderIntent as unknown as (...a: unknown[]) => Promise<string>)(...args),
}));

const { POST } = await import("./route");

// --- Helpers -----------------------------------------------------------------

function post(body: unknown, secret = SECRET) {
  return POST(
    new Request("http://localhost/api/webhooks/whatsapp", {
      method: "POST",
      headers: { apikey: secret, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

const JID = "5511999999999@s.whatsapp.net";

const evoTexto = (texto: string, jid = JID) => ({
  data: { key: { remoteJid: jid, id: "MSG1", fromMe: false }, message: { conversation: texto } },
});
const evoAudio = (jid = JID) => ({
  data: {
    key: { remoteJid: jid, id: "AUDIO1", fromMe: false },
    message: { audioMessage: { mimetype: "audio/ogg; codecs=opus" } },
  },
});
const evoImagem = (jid = JID) => ({
  data: {
    key: { remoteJid: jid, id: "IMG1", fromMe: false },
    message: { imageMessage: { mimetype: "image/jpeg" } },
  },
});

beforeEach(() => {
  process.env.WHATSAPP_WEBHOOK_SECRET = SECRET;
  pendente = null;
  link = { user_id: "user-1" };
  updates = [];
  updateError = null;
  vi.clearAllMocks();
  enviar.mockResolvedValue({ ok: true });
  obterMidiaBase64.mockResolvedValue({
    base64: "QUJD",
    mimeType: "audio/ogg; codecs=opus",
  });
  responderIntent.mockImplementation(
    async (_db, _u, intent: { tipo: string }) => `INTENT:${intent.tipo}`
  );
});

// --- Autorização e silêncio --------------------------------------------------

describe("autorização", () => {
  it("segredo errado → 401 e nada é processado", async () => {
    const res = await post(evoTexto("saldo"), "errado");
    expect(res.status).toBe(401);
    expect(responderIntent).not.toHaveBeenCalled();
    expect(enviar).not.toHaveBeenCalled();
  });
});

describe("silêncio (anti-spam)", () => {
  it("mensagem de grupo é ignorada sem responder", async () => {
    const res = await post(evoTexto("bom dia", "120363000@g.us"));
    await expect(res.json()).resolves.toMatchObject({ ok: true });
    expect(enviar).not.toHaveBeenCalled();
    expect(responderIntent).not.toHaveBeenCalled();
  });

  it("mensagem enviada por nós (fromMe) é ignorada", async () => {
    const res = await post({
      data: { key: { remoteJid: JID, id: "X", fromMe: true }, message: { conversation: "oi" } },
    });
    await expect(res.json()).resolves.toMatchObject({ ok: true });
    expect(enviar).not.toHaveBeenCalled();
  });

  it("remetente não vinculado não recebe resposta", async () => {
    link = null;
    const res = await post(evoTexto("saldo"));
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      ignored: "remetente não vinculado",
    });
    expect(enviar).not.toHaveBeenCalled();
  });
});

// --- Pareamento --------------------------------------------------------------

describe("pareamento", () => {
  it("código válido vincula o telefone e confirma", async () => {
    link = null;
    pendente = { user_id: "user-9" };
    const res = await post(evoTexto("9EPQGW"));
    const body = await res.json();
    expect(body.reply).toContain("WhatsApp conectado");
    expect(updates[0].vals).toMatchObject({
      telefone: "+5511999999999",
      status: "ativo",
      codigo_pareamento: null,
    });
  });

  it("telefone já vinculado a outra conta → erro amigável", async () => {
    link = null;
    pendente = { user_id: "user-9" };
    updateError = { message: "duplicate key" };
    const res = await post(evoTexto("9EPQGW"));
    await expect(res.json()).resolves.toMatchObject({
      reply: expect.stringContaining("já está vinculado"),
    });
  });

  it("código inexistente de remetente desconhecido → silêncio", async () => {
    link = null;
    pendente = null;
    const res = await post(evoTexto("ABC123"));
    await expect(res.json()).resolves.toMatchObject({
      ignored: "remetente não vinculado",
    });
  });
});

// --- Texto: regex antes da IA ------------------------------------------------

describe("texto", () => {
  it("comando conhecido usa o regex e NÃO chama a IA", async () => {
    const res = await post(evoTexto("saldo"));
    await expect(res.json()).resolves.toMatchObject({ reply: "INTENT:saldo" });
    expect(interpretar).not.toHaveBeenCalled();
  });

  it("frase livre cai na NLU e roteia o que a IA devolveu", async () => {
    interpretar.mockResolvedValue({ tipo: "consulta", alvo: "fechamento" });
    const res = await post(evoTexto("como foi meu mes de junho no geral"));
    expect(interpretar).toHaveBeenCalledWith("como foi meu mes de junho no geral");
    await expect(res.json()).resolves.toMatchObject({ reply: "INTENT:fechamento" });
  });

  it("IA indisponível (null) → responde o menu de ajuda", async () => {
    interpretar.mockResolvedValue(null);
    const res = await post(evoTexto("xyz sem sentido"));
    await expect(res.json()).resolves.toMatchObject({ reply: "INTENT:desconhecido" });
  });

  it("multi-gasto da IA vira registrar_lote", async () => {
    interpretar.mockResolvedValue({
      tipo: "registrar",
      gastos: [
        { valor: 184, descricao: "mercadinho" },
        { valor: 42, descricao: "gasolina" },
      ],
    });
    const res = await post(evoTexto("torrei 184 no mercadinho e 42 de gasolina"));
    await expect(res.json()).resolves.toMatchObject({ reply: "INTENT:registrar_lote" });
  });
});

// --- Áudio -------------------------------------------------------------------

describe("áudio", () => {
  it("baixa a mídia e roteia a intenção interpretada", async () => {
    interpretarAudio.mockResolvedValue({
      tipo: "registrar",
      gastos: [{ valor: 50, descricao: "mercado" }],
    });
    const res = await post(evoAudio());
    expect(obterMidiaBase64).toHaveBeenCalledWith("AUDIO1");
    // mimeType chega ao Gemini sem os parâmetros do codec
    expect(interpretarAudio).toHaveBeenCalledWith("QUJD", "audio/ogg");
    await expect(res.json()).resolves.toMatchObject({ reply: "INTENT:registrar" });
  });

  it("falha no download → mensagem amigável, sem quebrar", async () => {
    obterMidiaBase64.mockResolvedValue(null);
    const res = await post(evoAudio());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      reply: expect.stringContaining("Não consegui baixar"),
    });
    expect(interpretarAudio).not.toHaveBeenCalled();
  });

  it("áudio incompreensível → orienta usar texto", async () => {
    interpretarAudio.mockResolvedValue(null);
    const res = await post(evoAudio());
    await expect(res.json()).resolves.toMatchObject({
      reply: expect.stringContaining("Não entendi o áudio"),
    });
  });

  it("SEGURANÇA: não baixa mídia de remetente não vinculado", async () => {
    link = null;
    await post(evoAudio());
    expect(obterMidiaBase64).not.toHaveBeenCalled();
    expect(interpretarAudio).not.toHaveBeenCalled();
  });
});

// --- Imagem (nota fiscal) ----------------------------------------------------

describe("foto de nota fiscal", () => {
  it("registra o total e detalha os itens", async () => {
    obterMidiaBase64.mockResolvedValue({ base64: "SU1H", mimeType: "image/jpeg" });
    extrairNotaFiscal.mockResolvedValue({
      estabelecimento: "Supermercado Boa Compra",
      total: 87.4,
      itens: [
        { descricao: "Arroz 5kg", valor: 29.9 },
        { descricao: "Café", valor: 19.5 },
      ],
    });
    responderIntent.mockImplementation(
      async (_db, _u, intent: { tipo: string; valor?: number; descricao?: string }) =>
        `Anotado: ${intent.valor} — ${intent.descricao}`
    );

    const res = await post(evoImagem());
    expect(extrairNotaFiscal).toHaveBeenCalledWith("SU1H", "image/jpeg");
    const body = await res.json();
    expect(body.reply).toContain("87.4");
    expect(body.reply).toContain("Supermercado Boa Compra");
    expect(body.reply).toContain("Arroz 5kg");
    expect(body.reply).toContain("🧾 Itens");
  });

  it("nota com 1 item não vira lista redundante", async () => {
    obterMidiaBase64.mockResolvedValue({ base64: "SU1H", mimeType: "image/jpeg" });
    extrairNotaFiscal.mockResolvedValue({
      estabelecimento: "Padaria",
      total: 12,
      itens: [{ descricao: "Pão", valor: 12 }],
    });
    const res = await post(evoImagem());
    const body = await res.json();
    expect(body.reply).not.toContain("🧾 Itens");
  });

  it("imagem que não é nota → mensagem amigável", async () => {
    obterMidiaBase64.mockResolvedValue({ base64: "SU1H", mimeType: "image/jpeg" });
    extrairNotaFiscal.mockResolvedValue(null);
    const res = await post(evoImagem());
    await expect(res.json()).resolves.toMatchObject({
      reply: expect.stringContaining("nota fiscal"),
    });
  });
});

// --- Formato simples (usado nos testes manuais) -------------------------------

describe("formato simples {telefone, texto}", () => {
  it("continua funcionando (compat dos testes manuais)", async () => {
    const res = await post({ telefone: "+5511999999999", texto: "saldo" });
    await expect(res.json()).resolves.toMatchObject({ reply: "INTENT:saldo" });
  });

  it("payload sem mensagem suportada é ignorado", async () => {
    const res = await post({ data: { key: { remoteJid: JID, id: "Z" }, message: {} } });
    await expect(res.json()).resolves.toMatchObject({ ok: true });
    expect(enviar).not.toHaveBeenCalled();
  });
});
