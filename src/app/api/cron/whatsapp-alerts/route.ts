import { createAdminClient } from "@/lib/supabase/server";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { resumoFinanceiro } from "@/lib/finance-summary";
import { gerarAlertas } from "@/lib/alerts";
import { formatBRL } from "@/lib/format";

/**
 * Cron de alertas outbound por WhatsApp.
 *
 * Para cada usuário com WhatsApp vinculado, calcula o estado financeiro
 * (mesma fonte do dashboard), gera os alertas e envia os que ainda não foram
 * enviados nas últimas 24h (dedup via tabela `alerts`). Um único WhatsApp
 * consolidado por usuário.
 *
 * Protegido por CRON_SECRET (fail closed em produção). Idempotente por dia.
 */

export const dynamic = "force-dynamic";

const JANELA_DEDUP_H = 24;

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

  const { data: links, error } = await db
    .from("whatsapp_links")
    .select("user_id, telefone")
    .eq("status", "ativo")
    .not("telefone", "is", null);
  if (error) {
    console.error("cron whatsapp-alerts: lookup falhou:", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }

  const desde = new Date(Date.now() - JANELA_DEDUP_H * 3600_000).toISOString();
  let enviados = 0;

  for (const link of links ?? []) {
    if (!link.telefone) continue;

    const resumo = await resumoFinanceiro(db, link.user_id, hoje);
    const alertas = gerarAlertas({
      faturas: resumo.faturas,
      limiteStatus: resumo.limite.status,
      limiteDisponivel: resumo.limite.disponivel,
      duplicatas: resumo.duplicatas,
      orcamentos: resumo.orcamentos,
      hoje,
      fmt: formatBRL,
    });
    if (alertas.length === 0) continue;

    // Dedup: pula tipos já enviados na janela.
    const { data: recentes } = await db
      .from("alerts")
      .select("tipo")
      .eq("user_id", link.user_id)
      .eq("canal", "whatsapp")
      .gte("enviado_em", desde);
    const jaEnviados = new Set((recentes ?? []).map((r) => r.tipo));
    const novos = alertas.filter((a) => !jaEnviados.has(a.tipo));
    if (novos.length === 0) continue;

    const texto =
      "🔔 *Zap Finanças*\n\n" +
      novos.map((a) => `${a.titulo}\n${a.detalhe}`).join("\n\n");

    const r = await provider.enviar({ telefone: link.telefone, texto });
    if (!r.ok) continue;

    // Registra o envio (log outbound + base do dedup).
    const agora = new Date().toISOString();
    await db.from("alerts").insert(
      novos.map((a) => ({
        user_id: link.user_id,
        tipo: a.tipo,
        canal: "whatsapp",
        mensagem: a.titulo,
        enviado_em: agora,
      }))
    );
    enviados++;
  }

  return Response.json({ ok: true, vinculados: links?.length ?? 0, notificados: enviados });
}
