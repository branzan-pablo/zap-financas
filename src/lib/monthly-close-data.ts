import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { fecharMes, mesAnterior, type FechamentoMensal, type TxFechamento } from "./monthly-close";

/**
 * Carrega do banco os dados do fechamento de um mês (I/O) e delega a matemática
 * para a lib pura [monthly-close.ts](./monthly-close.ts).
 *
 * Fonte ÚNICA usada pelo comando "fechamento" do WhatsApp e pelo cron mensal.
 * Busca o mês pedido + o anterior (para a comparação de gastos) numa só query.
 */
export async function carregarFechamento(
  db: SupabaseClient<Database>,
  userId: string,
  mes: string // "YYYY-MM"
): Promise<FechamentoMensal> {
  const anterior = mesAnterior(mes);
  // Fim do mês pedido: dia 1 do mês seguinte (comparação exclusiva com `lt`).
  const [ano, m] = mes.split("-").map(Number);
  const fim = new Date(ano, m, 1);
  const fimStr = `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}-01`;

  const { data } = await db
    .from("transactions")
    .select("valor, data, descricao, categories(nome)")
    .eq("user_id", userId)
    .gte("data", `${anterior}-01`)
    .lt("data", fimStr)
    .order("data", { ascending: false })
    .limit(3000);

  const txs: TxFechamento[] = (
    (data ?? []) as unknown as {
      valor: number;
      data: string;
      descricao: string;
      categories: { nome: string } | null;
    }[]
  ).map((t) => ({
    valor: t.valor,
    data: t.data,
    descricao: t.descricao,
    categoria: t.categories?.nome ?? null,
  }));

  return fecharMes(txs, mes);
}
