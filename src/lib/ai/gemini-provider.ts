import type {
  AIProvider,
  CategoriaCandidata,
  CategorizacaoIA,
  GastoExtraido,
  InterpretacaoIA,
  NotaFiscalIA,
} from "./provider";

/**
 * Provider de IA usando Google Gemini via REST (free tier do Google AI Studio).
 *
 * Sem SDK novo — fetch puro, espelhando o estilo de [waitlist.ts](../waitlist.ts).
 * A chave (GEMINI_API_KEY) é SERVER-ONLY; este módulo só roda no servidor.
 *
 * Falha graciosa: qualquer erro de rede/parse devolve { categoriaId: null } em
 * vez de lançar, para nunca derrubar o pipeline de sync por causa da IA.
 *
 * Docs: https://ai.google.dev/api/generate-content
 */
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiAIProvider implements AIProvider {
  readonly nome = "gemini";

  constructor(
    private readonly apiKey: string,
    // `gemini-flash-latest` acompanha o modelo flash atual e tem cota do free
    // tier (o `gemini-2.0-flash` fixo pode retornar 429 por quota).
    private readonly model: string = "gemini-flash-latest"
  ) {}

  async categorize(
    descricao: string,
    candidatas: CategoriaCandidata[]
  ): Promise<CategorizacaoIA> {
    if (candidatas.length === 0) return { categoriaId: null, confianca: 0 };

    const lista = candidatas
      .map((c) => `- ${c.id}: ${c.nome}`)
      .join("\n");

    const prompt =
      `Você é um categorizador de transações financeiras brasileiras.\n` +
      `Dada a descrição de uma transação, escolha a categoria mais provável ` +
      `entre as opções (use o id exato). Se nenhuma fizer sentido, devolva ` +
      `categoriaId null.\n\n` +
      `Descrição: "${descricao}"\n\n` +
      `Categorias disponíveis (id: nome):\n${lista}`;

    try {
      const res = await fetch(
        `${ENDPOINT}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0,
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  categoriaId: { type: "string", nullable: true },
                  confianca: { type: "number" },
                },
                required: ["categoriaId", "confianca"],
              },
            },
          }),
        }
      );

      if (!res.ok) return { categoriaId: null, confianca: 0 };

      const data = await res.json();
      const texto: string | undefined =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!texto) return { categoriaId: null, confianca: 0 };

      const parsed = JSON.parse(texto) as CategorizacaoIA;

      // Valida que o id devolvido é de fato uma das candidatas.
      const valido =
        parsed.categoriaId != null &&
        candidatas.some((c) => c.id === parsed.categoriaId);

      return {
        categoriaId: valido ? parsed.categoriaId : null,
        confianca: typeof parsed.confianca === "number" ? parsed.confianca : 0,
      };
    } catch {
      return { categoriaId: null, confianca: 0 };
    }
  }

  // --- NLU e multimodal (WhatsApp) -----------------------------------------

  async interpretar(texto: string): Promise<InterpretacaoIA | null> {
    const raw = await this.gerarJSON(
      [{ text: `${PROMPT_NLU}\n\nMensagem do usuário: "${texto}"` }],
      SCHEMA_NLU
    );
    return normalizarInterpretacao(raw);
  }

  async interpretarAudio(
    base64: string,
    mimeType: string
  ): Promise<InterpretacaoIA | null> {
    const raw = await this.gerarJSON(
      [
        { inlineData: { mimeType, data: base64 } },
        { text: `${PROMPT_NLU}\n\nO conteúdo acima é uma mensagem de VOZ do usuário. Transcreva mentalmente e interprete.` },
      ],
      SCHEMA_NLU
    );
    return normalizarInterpretacao(raw);
  }

  async extrairNotaFiscal(
    base64: string,
    mimeType: string
  ): Promise<NotaFiscalIA | null> {
    const raw = (await this.gerarJSON(
      [
        { inlineData: { mimeType, data: base64 } },
        {
          text:
            "A imagem acima deve ser uma nota/cupom fiscal brasileiro (NFC-e, cupom de mercado, recibo). " +
            "Extraia: nome do estabelecimento, valor TOTAL pago em reais, data da compra (YYYY-MM-DD, se visível) " +
            "e a lista de itens com valor. Se a imagem NÃO for uma nota/recibo legível, devolva valida=false.",
        },
      ],
      SCHEMA_NOTA
    )) as Record<string, unknown> | null;
    if (!raw || raw.valida !== true) return null;

    const itens = (Array.isArray(raw.itens) ? raw.itens : [])
      .filter(
        (i): i is { descricao: string; valor: number } =>
          typeof (i as Record<string, unknown>)?.descricao === "string" &&
          typeof (i as Record<string, unknown>)?.valor === "number" &&
          ((i as Record<string, unknown>).valor as number) > 0
      )
      .map((i) => ({
        descricao: i.descricao.trim().slice(0, 80),
        valor: Math.round(i.valor * 100) / 100,
      }));

    let total = typeof raw.total === "number" && raw.total > 0 ? raw.total : 0;
    if (!total && itens.length) total = itens.reduce((s, i) => s + i.valor, 0);
    if (!total) return null;

    return {
      estabelecimento:
        typeof raw.estabelecimento === "string" && raw.estabelecimento.trim()
          ? raw.estabelecimento.trim().slice(0, 80)
          : "Nota fiscal",
      total: Math.round(total * 100) / 100,
      data:
        typeof raw.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.data)
          ? raw.data
          : undefined,
      itens,
    };
  }

  /** Chamada genérica em modo JSON (texto e/ou mídia inline). Erro → null. */
  private async gerarJSON(
    parts: unknown[],
    schema: object
  ): Promise<unknown | null> {
    try {
      const res = await fetch(
        `${ENDPOINT}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0,
              responseMimeType: "application/json",
              responseSchema: schema,
            },
          }),
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const texto: string | undefined =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return texto ? JSON.parse(texto) : null;
    } catch {
      return null;
    }
  }
}

// --- Prompt/schema compartilhados da NLU (texto e áudio) ---------------------

const PROMPT_NLU =
  "Você é o assistente de WhatsApp de um app brasileiro de finanças pessoais. " +
  "Interprete a mensagem do usuário e devolva JSON:\n" +
  '- Pergunta sobre saldo → {tipo:"consulta", alvo:"saldo"}; fatura do cartão → alvo:"fatura"; ' +
  'gastos do mês corrente/extrato → alvo:"gastos"; balanço/resumo/fechamento do MÊS PASSADO → ' +
  'alvo:"fechamento"; avaliação geral da situação financeira ("como estou?", "minha nota") → ' +
  'alvo:"score"; pedido de ajuda ou cumprimento sem pedido claro → alvo:"ajuda".\n' +
  "- Relato de um ou MAIS gastos (ex.: \"gastei 50 no mercado e 30 de uber ontem\") → " +
  '{tipo:"registrar", gastos:[{valor: em reais, descricao: curta, ex. "mercado"}]}.\n' +
  '- Nada disso → {tipo:"nenhum"}. Nunca invente valores.';

const SCHEMA_NLU = {
  type: "object",
  properties: {
    tipo: { type: "string", enum: ["consulta", "registrar", "nenhum"] },
    alvo: {
      type: "string",
      enum: ["saldo", "fatura", "gastos", "fechamento", "score", "ajuda"],
      nullable: true,
    },
    gastos: {
      type: "array",
      nullable: true,
      items: {
        type: "object",
        properties: {
          valor: { type: "number" },
          descricao: { type: "string" },
        },
        required: ["valor", "descricao"],
      },
    },
  },
  required: ["tipo"],
};

const SCHEMA_NOTA = {
  type: "object",
  properties: {
    valida: { type: "boolean" },
    estabelecimento: { type: "string", nullable: true },
    total: { type: "number", nullable: true },
    data: { type: "string", nullable: true },
    itens: {
      type: "array",
      nullable: true,
      items: {
        type: "object",
        properties: {
          descricao: { type: "string" },
          valor: { type: "number" },
        },
        required: ["descricao", "valor"],
      },
    },
  },
  required: ["valida"],
};

/** Valida/normaliza o JSON cru da NLU para o tipo do domínio. */
function normalizarInterpretacao(raw: unknown): InterpretacaoIA | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  if (
    r.tipo === "consulta" &&
    (r.alvo === "saldo" ||
      r.alvo === "fatura" ||
      r.alvo === "gastos" ||
      r.alvo === "fechamento" ||
      r.alvo === "score" ||
      r.alvo === "ajuda")
  ) {
    return { tipo: "consulta", alvo: r.alvo };
  }

  if (r.tipo === "registrar" && Array.isArray(r.gastos)) {
    const gastos: GastoExtraido[] = r.gastos
      .filter(
        (g): g is { valor: number; descricao: string } =>
          typeof (g as Record<string, unknown>)?.valor === "number" &&
          ((g as Record<string, unknown>).valor as number) > 0 &&
          typeof (g as Record<string, unknown>)?.descricao === "string" &&
          !!((g as Record<string, unknown>).descricao as string).trim()
      )
      .map((g) => ({
        valor: Math.round(g.valor * 100) / 100,
        descricao: g.descricao.trim().slice(0, 120),
      }));
    if (gastos.length) return { tipo: "registrar", gastos };
  }

  if (r.tipo === "nenhum") return { tipo: "nenhum" };
  return null;
}
