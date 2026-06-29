import type { AIProvider, CategoriaCandidata, CategorizacaoIA } from "./provider";
import { normalizar } from "../categorization/rules";

/**
 * Provider de IA MOCK — heurístico local, sem rede.
 *
 * Usado quando não há GEMINI_API_KEY. Faz um best-effort honesto: tenta casar
 * o nome de alguma categoria candidata com a descrição. Se nada bater, devolve
 * null (o caller deixa cair em "Outros"). Determinístico e offline.
 */
export class MockAIProvider implements AIProvider {
  readonly nome = "mock";

  async categorize(
    descricao: string,
    candidatas: CategoriaCandidata[]
  ): Promise<CategorizacaoIA> {
    const desc = normalizar(descricao);

    for (const cat of candidatas) {
      // primeira palavra do nome da categoria (ex.: "Casa & Contas" → "casa")
      const termo = normalizar(cat.nome).split(" ")[0];
      if (termo.length >= 4 && desc.includes(termo)) {
        return { categoriaId: cat.id, confianca: 0.4 };
      }
    }
    return { categoriaId: null, confianca: 0 };
  }
}
