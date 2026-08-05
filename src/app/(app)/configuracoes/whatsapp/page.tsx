import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { gerarCodigoPareamento, desvincularWhatsapp } from "./actions";

type WaLink = {
  telefone: string | null;
  status: string;
  codigo_pareamento: string | null;
  codigo_expira_em: string | null;
};

function mascararTelefone(tel: string | null): string {
  if (!tel) return "";
  return tel.replace(/(\d{2,3})\d+(\d{2})$/, "$1•••••$2");
}

export default async function WhatsAppPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("whatsapp_links")
    .select("telefone, status, codigo_pareamento, codigo_expira_em")
    .maybeSingle();
  const link = data as WaLink | null;

  const numeroZap = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null;
  const codigoValido =
    link?.status === "pendente" &&
    link.codigo_pareamento &&
    link.codigo_expira_em &&
    new Date(link.codigo_expira_em) > new Date();
  const ativo = link?.status === "ativo" && link.telefone;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        voltar={{ href: "/configuracoes", label: "Configurações" }}
        titulo="WhatsApp"
        descricao="Vincule seu número para consultar suas finanças e registrar gastos pelo WhatsApp."
      />

      {ativo ? (
        <Card padding="lg">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald" aria-hidden />
            <p className="font-medium text-ink">WhatsApp conectado</p>
          </div>
          <p className="mt-1 text-sm text-slate">
            Número {mascararTelefone(link!.telefone)}. Você já pode mandar
            mensagens como “qual meu saldo?” ou “gastei 50 no mercado”.
          </p>
          <form action={desvincularWhatsapp} className="mt-5">
            <Button variant="outline" size="sm" type="submit">
              Desvincular
            </Button>
          </form>
        </Card>
      ) : codigoValido ? (
        <Card padding="lg" className="text-center">
          <p className="text-sm text-slate">Seu código de pareamento</p>
          <p className="my-3 font-num text-4xl font-bold tracking-[0.3em] text-ink">
            {link!.codigo_pareamento}
          </p>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate">
            Envie esse código pelo WhatsApp para{" "}
            <span className="font-medium text-ink">
              {numeroZap ?? "o número do Zap Finanças"}
            </span>{" "}
            em até 10 minutos. Assim que recebermos, seu número fica vinculado.
          </p>
          <form action={gerarCodigoPareamento} className="mt-5">
            <Button variant="ghost" size="sm" type="submit">
              Gerar novo código
            </Button>
          </form>
        </Card>
      ) : (
        <EmptyState
          icone="💬"
          titulo="Conecte seu WhatsApp"
          descricao="Gere um código e envie pelo WhatsApp para vincular seu número. Depois é só conversar com o Zap."
          acao={
            <form action={gerarCodigoPareamento}>
              <Button type="submit">Gerar código de pareamento</Button>
            </form>
          }
        />
      )}
    </div>
  );
}
