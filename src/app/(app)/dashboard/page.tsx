import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const nome = profile?.nome ?? user?.email?.split("@")[0] ?? "você";

  // Trial days remaining
  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const trialDays = trialEnds
    ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86_400_000))
    : null;
  const onTrial = profile?.plano === "trial" && trialDays !== null && trialDays > 0;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink">
          Olá, {nome} 👋
        </h1>
        <p className="mt-1 text-slate">
          Bem-vindo ao Zap Finanças. Vamos conectar suas contas para começar.
        </p>
      </div>

      {/* Trial banner */}
      {onTrial && (
        <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-emerald/30 bg-emerald-soft px-6 py-4">
          <div>
            <p className="font-medium text-[#0a6e44]">
              Trial grátis —{" "}
              <span className="font-num font-bold">
                {trialDays} dia{trialDays !== 1 ? "s" : ""}
              </span>{" "}
              restante{trialDays !== 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-sm text-[#0a6e44]/80">
              Explore tudo sem limitações. Assine antes do trial acabar para não
              perder o acesso.
            </p>
          </div>
          <Link
            href="/configuracoes/assinatura"
            className="shrink-0 rounded-[10px] bg-emerald px-4 py-2 text-sm font-medium text-white hover:bg-emerald/90"
          >
            Assinar agora
          </Link>
        </div>
      )}

      {/* Empty state — Connect Open Finance */}
      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-soft text-2xl">
          🏦
        </div>
        <h2 className="font-display text-xl font-bold text-ink">
          Conecte seu banco
        </h2>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed text-slate">
          Conecte suas contas via Open Finance e veja todos os seus gastos,
          fatura do cartão e investimentos em um só lugar.
        </p>
        <Link
          href="/contas"
          className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-emerald px-5 py-2.5 font-medium text-white hover:bg-emerald/90"
        >
          Conectar banco
        </Link>
        <p className="mt-3 text-xs text-slate">
          Seguro via Open Finance · Apenas leitura · Sem acesso a movimentações
        </p>
      </div>

      {/* Quick links */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            href: "/contas",
            icon: "🏦",
            title: "Contas",
            desc: "Conecte bancos e cartões via Open Finance",
          },
          {
            href: "/configuracoes/whatsapp",
            icon: "💬",
            title: "WhatsApp",
            desc: "Vincule seu número para consultar pelo Zap",
          },
          {
            href: "/metas",
            icon: "🎯",
            title: "Metas",
            desc: "Crie metas de economia e acompanhe o progresso",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-[0_4px_12px_rgba(11,18,32,.08)]"
          >
            <span className="text-2xl" aria-hidden>
              {item.icon}
            </span>
            <div>
              <p className="font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-sm text-slate">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
