import type {
  AIProvider,
  CategoriaCandidata,
  CategorizacaoIA,
  InterpretacaoIA,
  NotaFiscalIA,
} from "./provider";
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

  // NLU e multimodal exigem IA real. O mock devolve null e o chamador degrada
  // com mensagem amigável — o caminho determinístico (regex) segue funcionando
  // offline, então dev local não perde os comandos básicos.
  async interpretar(): Promise<InterpretacaoIA | null> {
    return null;
  }

  async interpretarAudio(): Promise<InterpretacaoIA | null> {
    return null;
  }

  async extrairNotaFiscal(): Promise<NotaFiscalIA | null> {
    return null;
  }
}
