import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getAIProvider } from "@/lib/ai";
import { categorizarPorRegras, type CategoriaRegra } from "./rules";

/**
 * Categorização automática de UMA descrição: regras determinísticas primeiro,
 * fallback de IA só para o que não casar — mesma política do sync e do
 * assistente de WhatsApp.
 *
 * Para lotes grandes (sync) vale carregar as categorias uma única vez; aqui o
 * caso de uso é um lançamento avulso feito por uma pessoa, então uma leitura
 * por chamada é irrelevante e o código fica direto.
 */
export async function categorizarAuto(
  db: SupabaseClient<Database>,
  userId: string,
  descricao: string
): Promise<string | null> {
  const { data: cats } = await db
    .from("categories")
    .select("id, nome, regras")
    .or(`user_id.is.null,user_id.eq.${userId}`);

  const categorias: CategoriaRegra[] = (cats ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    regras: Array.isArray(c.regras) ? (c.regras as string[]) : null,
  }));

  const porRegra = categorizarPorRegras(descricao, categorias);
  if (porRegra) return porRegra;

  const r = await getAIProvider().categorize(
    descricao,
    categorias.map((c) => ({ id: c.id, nome: c.nome }))
  );
  return r.categoriaId;
}
