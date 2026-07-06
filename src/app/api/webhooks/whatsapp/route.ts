import { createAdminClient } from "@/lib/supabase/server";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { interpretarMensagem } from "@/lib/whatsapp/intent";
import { responderIntent } from "@/lib/whatsapp/handler";

/**
 * Webhook inbound do WhatsApp (Evolution API) — mensagens recebidas.
 *
 * Fluxo:
 *   1. valida o segredo (fail closed em produção);
 *   2. normaliza {telefone, texto} do payload (formato Evolution ou simples);
 *   3. se o texto for um código de pareamento pendente → ativa o vínculo;
 *   4. senão resolve o usuário pelo telefone e roteia a intenção;
 *   5. responde via provider (mock não envia de fato) e devolve a resposta no
 *      corpo (útil p/ testar o fluxo sem WhatsApp real).
 *
 * Sem sessão de usuário → admin client.
 */

function autorizado(req: Request): boolean {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // fail closed em prod
  return req.headers.get("apikey") === secret || req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Normaliza um telefone para E.164 simples: só dígitos com prefixo '+'. */
function normalizarTelefone(bruto: string): string {
  const digitos = bruto.replace(/@.*$/, "").replace(/\D/g, "");
  return digitos ? `+${digitos}` : "";
}

/** Extrai {telefone, texto} de payloads Evolution ou do formato simples de teste. */
function extrair(payload: unknown): { telefone: string; texto: string } | null {
  const p = payload as Record<string, unknown>;
  // Formato simples (mock/testes): { telefone, texto }
  if (typeof p?.telefone === "string" && typeof p?.texto === "string") {
    return { telefone: normalizarTelefone(p.telefone), texto: p.texto };
  }
  // Formato Evolution: { data: { key: { remoteJid }, message: { conversation } } }
  const data = p?.data as Record<string, unknown> | undefined;
  const key = data?.key as Record<string, unknown> | undefined;
  const message = data?.message as Record<string, unknown> | undefined;
  if (key?.fromMe === true) return null; // ignora mensagens enviadas por nós
  const jid = typeof key?.remoteJid === "string" ? key.remoteJid : "";
  // Só atendemos conversas 1:1 — nunca grupos (@g.us) nem status/broadcast.
  // (O número do bot pode receber mensagens de grupos; responder neles é spam.)
  if (!jid || jid.includes("@g.us") || jid.includes("@broadcast")) return null;
  const texto =
    (typeof message?.conversation === "string" && message.conversation) ||
    ((message?.extendedTextMessage as Record<string, unknown> | undefined)?.text as string) ||
    "";
  if (!jid || !texto) return null;
  return { telefone: normalizarTelefone(jid), texto };
}

export async function POST(request: Request) {
  if (!autorizado(request)) {
    return Response.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const msg = extrair(payload);
  if (!msg || !msg.telefone || !msg.texto) {
    return Response.json({ ok: true, ignored: "sem mensagem de texto" });
  }

  const db = createAdminClient();
  const provider = getWhatsAppProvider();
  const responder = async (texto: string) => {
    await provider.enviar({ telefone: msg.telefone, texto });
    return Response.json({ ok: true, reply: texto });
  };

  // 1. Tentativa de pareamento: o texto é um código pendente válido?
  const codigo = msg.texto.trim().toUpperCase();
  if (/^[A-Z0-9]{6}$/.test(codigo)) {
    const { data: pend } = await db
      .from("whatsapp_links")
      .select("user_id")
      .eq("codigo_pareamento", codigo)
      .eq("status", "pendente")
      .gt("codigo_expira_em", new Date().toISOString())
      .maybeSingle();
    if (pend) {
      const { error } = await db
        .from("whatsapp_links")
        .update({
          telefone: msg.telefone,
          status: "ativo",
          codigo_pareamento: null,
          codigo_expira_em: null,
          paired_at: new Date().toISOString(),
        })
        .eq("user_id", pend.user_id);
      if (error) {
        return responder(
          "Esse número já está vinculado a outra conta. Desvincule lá primeiro."
        );
      }
      return responder(
        "WhatsApp conectado! 🎉 Mande *ajuda* para ver o que eu faço."
      );
    }
  }

  // 2. Resolve o usuário pelo telefone vinculado.
  const { data: link } = await db
    .from("whatsapp_links")
    .select("user_id")
    .eq("telefone", msg.telefone)
    .eq("status", "ativo")
    .maybeSingle();
  if (!link) {
    // Remetente não vinculado e o texto não é um código de pareamento válido →
    // SILÊNCIO. Nunca respondemos a números desconhecidos: o número do bot recebe
    // mensagens de qualquer contato, e responder a todos vira spam. O onboarding
    // acontece pelo código gerado no app (fluxo de pareamento acima).
    return Response.json({ ok: true, ignored: "remetente não vinculado" });
  }

  // 3. Interpreta e responde.
  try {
    const intent = interpretarMensagem(msg.texto);
    const reply = await responderIntent(db, link.user_id, intent);
    return responder(reply);
  } catch (e) {
    console.error("webhook whatsapp: handler falhou:", e);
    return responder("Tive um problema agora. Tente de novo em instantes.");
  }
}
