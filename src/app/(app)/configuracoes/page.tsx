import { createClient } from "@/lib/supabase/server";
import { trialDaysRemaining } from "@/lib/trial";
import Link from "next/link";
import { DangerZone } from "@/components/app/danger-zone";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const trialDays = trialDaysRemaining(profile?.trial_ends_at ?? null);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          Configurações
        </h1>
        <p className="mt-1 text-slate">Gerencie sua conta e assinatura.</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-semibold text-ink">Perfil</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate">Nome</dt>
              <dd className="font-medium text-ink">{profile?.nome ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Email</dt>
              <dd className="font-num font-medium text-ink">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">WhatsApp</dt>
              <dd className="text-ink">
                <Link href="/configuracoes/whatsapp" className="text-emerald hover:underline">
                  Gerenciar
                </Link>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Categorias</dt>
              <dd className="text-ink">
                <Link href="/configuracoes/categorias" className="text-emerald hover:underline">
                  Personalizar
                </Link>
              </dd>
            </div>
          </dl>
        </section>

        {/* Subscription */}
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-semibold text-ink">Assinatura</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate">Plano atual</dt>
              <dd className="font-medium text-ink capitalize">
                {profile?.plano ?? "trial"}
              </dd>
            </div>
            {trialDays !== null && profile?.plano === "trial" && (
              <div className="flex justify-between">
                <dt className="text-slate">Trial restante</dt>
                <dd className="font-num font-medium text-ink">
                  {trialDays} dia{trialDays !== 1 ? "s" : ""}
                </dd>
              </div>
            )}
          </dl>
          {profile?.plano === "trial" && (
            <div className="mt-5">
              <Link
                href="/assinar"
                className="inline-flex items-center gap-2 rounded-[10px] bg-emerald px-4 py-2 text-sm font-medium text-white hover:bg-emerald/90"
              >
                Ver planos e assinar
              </Link>
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-semibold text-ink">Dados e privacidade</h2>
          <p className="mt-2 text-sm text-slate">
            Em conformidade com a LGPD, você pode exportar ou excluir seus dados
            a qualquer momento.
          </p>
          <DangerZone />
        </section>
      </div>
    </div>
  );
}
