import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { calcularStreak, type Streak } from "./streak";

/**
 * Carrega as datas dos lançamentos feitos PELO usuário (WhatsApp ou manual) e
 * delega o cálculo à lib pura [streak.ts](./streak.ts).
 *
 * Fonte única do streak para o dashboard e para o assistente de WhatsApp.
 * A janela de ~400 dias limita o custo da query; o recorde considera até um ano
 * de histórico, o que é suficiente para o incentivo pretendido.
 */
export async function carregarStreak(
  db: SupabaseClient<Database>,
  userId: string,
  hoje: Date = new Date()
): Promise<Streak> {
  const desde = new Date(hoje);
  desde.setDate(desde.getDate() - 400);
  const desdeStr = `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, "0")}-${String(desde.getDate()).padStart(2, "0")}`;

  const { data } = await db
    .from("transactions")
    .select("data")
    .eq("user_id", userId)
    .in("origem", ["whatsapp", "manual"])
    .gte("data", desdeStr)
    .order("data", { ascending: false })
    .limit(1000);

  return calcularStreak((data ?? []).map((t) => t.data), hoje);
}
