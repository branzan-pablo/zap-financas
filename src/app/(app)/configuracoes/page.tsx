import { createClient } from "@/lib/supabase/server";
import { trialDaysRemaining } from "@/lib/trial";
import Link from "next/link";
import { DangerZone } from "@/components/app/danger-zone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

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
      <PageHeader titulo="Configurações" descricao="Gerencie sua conta e assinatura." />

      <div className="space-y-4">
        {/* Profile */}
        <Card padding="lg" render={<section />}>
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
            <div className="flex justify-between">
              <dt className="text-slate">Tour do app</dt>
              <dd className="text-ink">
                <Link href="/dashboard?tour=1" className="text-emerald hover:underline">
                  Refazer
                </Link>
              </dd>
            </div>
          </dl>
        </Card>

        {/* Subscription */}
        <Card padding="lg" render={<section />}>
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
              <Button variant="emerald" render={<Link href="/assinar" />}>
                Ver planos e assinar
              </Button>
            </div>
          )}
        </Card>

        {/* Danger zone */}
        <Card padding="lg" render={<section />}>
          <h2 className="font-semibold text-ink">Dados e privacidade</h2>
          <p className="mt-2 text-sm text-slate">
            Em conformidade com a LGPD, você pode exportar ou excluir seus dados
            a qualquer momento.
          </p>
          <DangerZone />
        </Card>
      </div>
    </div>
  );
}
