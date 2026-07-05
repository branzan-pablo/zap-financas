import type { AIProvider, CategoriaCandidata, CategorizacaoIA } from "./provider";

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
}
