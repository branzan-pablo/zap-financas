import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pagamento confirmado · Zap Finanças",
  robots: { index: false },
};

export default function Obrigado() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-soft text-2xl text-emerald">
          ✓
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink">
          Você é fundador do Zap Finanças.
        </h1>
        <p className="mt-4 leading-relaxed text-slate">
          Recebemos sua reserva. Seu preço de fundador fica travado pra sempre.
          Vamos te avisar por email assim que o acesso abrir, e você entra entre
          os primeiros.
        </p>
        <div className="mt-8">
          <Link href="/" className={cn(buttonVariants(), "h-11 px-6")}>
            Voltar ao início
          </Link>
        </div>
        <p className="mt-6 font-num text-xs uppercase tracking-[0.18em] text-slate">
          Qualquer dúvida, é só responder o email da compra
        </p>
      </div>
    </main>
  );
}
