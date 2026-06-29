import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/app/sidebar";
import { MobileNav } from "@/components/app/mobile-nav";
import { avaliarAcesso } from "@/lib/payments/access";

/**
 * Authenticated app shell layout.
 * All routes under (app)/ require a valid session.
 * The proxy handles optimistic redirects; this layout does the authoritative check.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Perfil (nome + trial) e assinatura para o gating de acesso.
  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("nome, trial_ends_at").eq("id", user.id).single(),
    supabase.from("subscriptions").select("status, periodo_fim").maybeSingle(),
  ]);

  // Gate: sem trial vigente e sem assinatura ativa → paywall.
  const acesso = avaliarAcesso({
    trialEndsAt: profile?.trial_ends_at ?? null,
    status: sub?.status ?? null,
    periodoFim: sub?.periodo_fim ?? null,
  });
  if (!acesso.liberado) {
    redirect("/assinar");
  }

  const userName = profile?.nome ?? user.email?.split("@")[0] ?? null;

  return (
    <div className="flex h-svh overflow-hidden bg-paper">
      {/* Sidebar — apenas desktop (md+) */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar userName={userName} />
      </div>

      {/* Coluna principal */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar mobile — presença de marca (a sidebar fica oculta abaixo de md) */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-white px-4 md:hidden">
          <span className="grid size-7 place-items-center rounded-lg bg-emerald text-xs font-bold text-white">
            Z
          </span>
          <span className="font-display text-base font-bold text-ink">
            Zap Finanças
          </span>
        </header>

        {/* Conteúdo — pb-24 reserva espaço para a bottom nav no mobile */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 md:p-8">
          {children}
        </main>
      </div>

      {/* Navegação mobile (bottom tab bar + folha "Mais") */}
      <MobileNav />
    </div>
  );
}
