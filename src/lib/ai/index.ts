import type { AIProvider } from "./provider";
import { GeminiAIProvider } from "./gemini-provider";
import { MockAIProvider } from "./mock-provider";

export type { AIProvider, CategoriaCandidata, CategorizacaoIA } from "./provider";

/**
 * Factory do provider de IA — escolhe a implementação por env.
 *
 * Mesma filosofia de [waitlist.ts](../waitlist.ts): usa o serviço real quando
 * há credencial; senão, cai num fallback offline seguro.
 *
 *   AI_PROVIDER=gemini + GEMINI_API_KEY → Gemini real
 *   (sem chave, ou AI_PROVIDER=mock)    → heurístico local
 *
 * Default inteligente: se a chave existe e AI_PROVIDER não foi setado, usa
 * Gemini; assim basta preencher GEMINI_API_KEY para ligar a IA.
 */
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER;
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;

  const querGemini = provider === "gemini" || (!provider && !!apiKey);

  if (querGemini) {
    if (!apiKey) {
      throw new Error("AI_PROVIDER=gemini requer GEMINI_API_KEY.");
    }
    return new GeminiAIProvider(apiKey, model || undefined);
  }

  return new MockAIProvider();
}
