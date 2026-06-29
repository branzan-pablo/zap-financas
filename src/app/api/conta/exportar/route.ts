import { createClient } from "@/lib/supabase/server";

/**
 * Export de dados (LGPD — direito de portabilidade).
 *
 * Reúne todos os dados do usuário autenticado e devolve um JSON para download.
 * Usa o client RLS do próprio usuário, então só exporta o que é dele.
 */
export const dynamic = "force-dynamic";

// Tabelas com os dados do usuário (todas filtradas por RLS = dados próprios).
const TABELAS = [
  "accounts",
  "transactions",
  "cards",
  "installments",
  "budgets",
  "goals",
  "investments",
  "subscriptions",
  "alerts",
  "whatsapp_links",
] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Categorias próprias (as globais não são dados pessoais).
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id);

  const dados: Record<string, unknown> = {
    exportado_em: new Date().toISOString(),
    conta: { id: user.id, email: user.email },
    profile,
    categories,
  };

  for (const tabela of TABELAS) {
    const { data } = await supabase.from(tabela).select("*").eq("user_id", user.id);
    dados[tabela] = data ?? [];
  }

  const json = JSON.stringify(dados, null, 2);
  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="zap-financas-meus-dados.json"`,
      "Cache-Control": "no-store",
    },
  });
}
