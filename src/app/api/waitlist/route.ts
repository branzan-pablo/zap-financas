import { saveLead } from "@/lib/waitlist";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Requisição inválida." },
      { status: 400 }
    );
  }

  // Honeypot: a filled "hp" field means a bot. Pretend success, save nothing.
  if (body?.hp) {
    return Response.json({ ok: true });
  }

  const email = String(body?.email ?? "")
    .trim()
    .toLowerCase();

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json(
      { ok: false, error: "Digite um email válido." },
      { status: 422 }
    );
  }

  try {
    const { mode } = await saveLead({
      email,
      wants_founder: Boolean(body?.wants_founder),
      price_shown: body?.price_shown ? String(body.price_shown).slice(0, 60) : null,
      source: body?.source ? String(body.source).slice(0, 120) : null,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
    return Response.json({ ok: true, mode });
  } catch {
    return Response.json(
      { ok: false, error: "Não foi possível salvar agora. Tente de novo." },
      { status: 500 }
    );
  }
}
