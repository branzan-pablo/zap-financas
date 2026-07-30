import { createAdminClient } from "@/lib/supabase/server";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { carregarFechamento } from "@/lib/monthly-close-data";
import { mensagemFechamento, mesAFechar } from "@/lib/monthly-close";
import { formatBRL } from "@/lib/format";

/**
 * Cron do fechamento mensal — roda no dia 1º e manda, por WhatsApp, o retrato
 * do mês que acabou (entradas, saídas, o que sobrou, top categorias, comparação
 * com o mês anterior).
 *
 * Mesma fonte do comando "fechamento" do assistente (carregarFechamento), então
 * o número que o usuário vê aqui é idêntico ao que ele recebe se perguntar.
 *
 * Protegido por CRON_SECRET (fail closed em produção). Idempotente no mês:
 * dedup via tabela `alerts` (tipo `fechamento_mensal`, mensagem = mês fechado),
 * então reexecuções no mesmo mês não reenviam.
 */

export const dynamic = "force-dynamic";

const TIPO = "fechamento_mensal";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return Response.json({ ok: false, error: "Cron não configurado." }, { status: 503 });
    }
  } else if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const db = createAdminClient();
  const provider = getWhatsAppProvider();
  const hoje = new Date();
  const mes = mesAFechar(hoje);

  const { data: links, error } = await db
    .from("whatsapp_links")
    .select("user_id, telefone")
    .eq("status", "ativo")
    .not("telefone", "is", null);
  if (error) {
    console.error("cron monthly-close: lookup falhou:", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }

  let enviados = 0;

  for (const link of links ?? []) {
    if (!link.telefone) continue;

    // Dedup: já mandamos o fechamento DESTE mês para este usuário?
    const { data: ja } = await db
      .from("alerts")
      .select("id")
      .eq("user_id", link.user_id)
      .eq("tipo", TIPO)
      .eq("mensagem", mes)
      .maybeSingle();
    if (ja) continue;

    const fechamento = await carregarFechamento(db, link.user_id, mes);
    // Sem movimentação no mês não vale gastar uma mensagem.
    if (fechamento.numTransacoes === 0) continue;

    const r = await provider.enviar({
      telefone: link.telefone,
      texto: mensagemFechamento(fechamento, formatBRL),
    });
    if (!r.ok) continue;

    await db.from("alerts").insert({
      user_id: link.user_id,
      tipo: TIPO,
      canal: "whatsapp",
      mensagem: mes, // chave do dedup (mês fechado)
      enviado_em: new Date().toISOString(),
    });
    enviados++;
  }

  return Response.json({
    ok: true,
    mes,
    vinculados: links?.length ?? 0,
    notificados: enviados,
  });
}
