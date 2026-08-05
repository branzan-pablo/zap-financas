import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function MetasPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        titulo="Metas"
        descricao="Fundo de emergência, viagem, carro — acompanhe seu progresso."
      />

      <EmptyState
        icone="🎯"
        titulo="Nenhuma meta criada"
        descricao="Crie metas financeiras e acompanhe seu progresso. O assistente do WhatsApp também vai te alertar quando você estiver perto de bater."
        acao={
          <Badge tone="ok" className="h-auto px-4 py-1.5 text-sm">
            Em desenvolvimento — Fase 2
          </Badge>
        }
      />
    </div>
  );
}
