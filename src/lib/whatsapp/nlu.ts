import type { InterpretacaoIA } from "@/lib/ai/provider";
import type { Intent } from "./intent";

/**
 * Ponte entre a NLU da camada de IA e as intenções do WhatsApp.
 *
 * O parser determinístico ([intent.ts](./intent.ts)) continua sendo o caminho
 * rápido; a IA só entra quando ele devolve "desconhecido". Este mapeamento é
 * PURO e testável — a chamada de rede fica no provider de IA.
 *
 * Retorna `null` quando a IA não entendeu (ou não está disponível): o chamador
 * mantém o "desconhecido" e responde com o menu de ajuda.
 */
export function mapearInterpretacao(r: InterpretacaoIA | null): Intent | null {
  if (!r || r.tipo === "nenhum") return null;

  if (r.tipo === "consulta") {
    switch (r.alvo) {
      case "saldo":
        return { tipo: "saldo" };
      case "fatura":
        return { tipo: "fatura" };
      case "gastos":
        return { tipo: "gastos" };
      case "fechamento":
        return { tipo: "fechamento" };
      case "score":
        return { tipo: "score" };
      case "ajuda":
        return { tipo: "ajuda" };
    }
  }

  if (r.tipo === "registrar") {
    // O provider já validou/normalizou; aqui só decidimos single × lote.
    if (r.gastos.length === 0) return null;
    if (r.gastos.length === 1) {
      return {
        tipo: "registrar",
        valor: r.gastos[0].valor,
        descricao: r.gastos[0].descricao,
      };
    }
    return { tipo: "registrar_lote", itens: r.gastos };
  }

  return null;
}
