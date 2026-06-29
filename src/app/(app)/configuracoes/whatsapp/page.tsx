import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
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
      <div className="mb-6">
        <Link href="/configuracoes" className="text-sm text-slate hover:text-ink">
          ← Configurações
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">
          WhatsApp
        </h1>
        <p className="mt-1 text-slate">
          Vincule seu número para consultar suas finanças e registrar gastos pelo
          WhatsApp.
        </p>
      </div>

      {ativo ? (
        <div className="rounded-2xl border border-line bg-white p-6">
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
        </div>
      ) : codigoValido ? (
        <div className="rounded-2xl border border-line bg-white p-6 text-center">
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
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-soft text-2xl">
            💬
          </div>
          <h2 className="font-display text-lg font-bold text-ink">
            Conecte seu WhatsApp
          </h2>
          <p className="mx-auto mt-2 max-w-sm leading-relaxed text-slate">
            Gere um código e envie pelo WhatsApp para vincular seu número. Depois
            é só conversar com o Zap.
          </p>
          <form action={gerarCodigoPareamento} className="mt-5">
            <Button type="submit">Gerar código de pareamento</Button>
          </form>
        </div>
      )}
    </div>
  );
}
