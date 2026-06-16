import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { FaturaSignature } from "@/components/landing/fatura-signature";

const FOUNDER_PRICE = "R$ 89/ano (fundador)";

const SUSTOS = [
  {
    titulo: "Parcelas escondidas",
    texto:
      "Aquele “10x sem juros” de meses atrás ainda está comendo sua fatura — e você nem lembra dele.",
  },
  {
    titulo: "O susto do fechamento",
    texto:
      "Você só descobre o tamanho real da fatura quando ela fecha. Aí já não dá pra fazer nada.",
  },
  {
    titulo: "Sem noção do futuro",
    texto:
      "Quanto dos seus próximos 6 meses você já comprometeu em parcelas? A maioria não faz ideia.",
  },
];

const PASSOS = [
  {
    n: "01",
    titulo: "Manda no zap",
    texto: "“Comprei uma TV em 10x de 300.” Pronto — registrado, com as parcelas.",
  },
  {
    n: "02",
    titulo: "Vê a fatura projetada",
    texto: "Pergunte a qualquer momento como está sua fatura. Em tempo real.",
  },
  {
    n: "03",
    titulo: "É avisado antes de fechar",
    texto: "Um alerta dias antes do fechamento. Tempo de respirar e ajustar.",
  },
];

const FEATURES = [
  {
    titulo: "Fatura projetada",
    texto: "Saiba agora quanto sua fatura vai fechar — não no fim do mês.",
  },
  {
    titulo: "Mapa de parcelas",
    texto: "Veja, mês a mês, quanto você já comprometeu lá na frente.",
  },
  {
    titulo: "Alerta pré-fechamento",
    texto: "Um aviso no WhatsApp antes da fatura fechar. Sem mais sustos.",
  },
];

const PLANO = [
  "Cartões ilimitados",
  "Fatura projetada em tempo real",
  "Mapa de parcelas futuras",
  "Alertas antes do fechamento",
  "Captura de compras pelo WhatsApp",
];

export default function Home() {
  return (
    <>
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <span className="grid size-7 place-items-center rounded-lg bg-emerald text-white">
            C
          </span>
          CartãoZap
        </span>
        <a
          href="#lista"
          className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
        >
          Entrar na lista
        </a>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-10 pb-24 lg:grid-cols-2 lg:gap-8 lg:pt-16">
          <div>
            <Badge
              variant="secondary"
              className="bg-emerald-soft text-[#0a6e44]"
            >
              Controle de cartão • pelo WhatsApp
            </Badge>
            <h1 className="mt-5 text-4xl leading-[1.05] font-bold text-balance text-ink sm:text-5xl lg:text-6xl">
              Saiba sua fatura antes dela fechar.
            </h1>
            <p className="mt-5 max-w-md text-lg text-slate">
              Registre suas compras — até as parceladas — mandando uma mensagem.
              O CartãoZap mostra sua fatura projetada e quanto você já
              comprometeu nos próximos meses.
            </p>

            <div id="lista" className="mt-8 max-w-md scroll-mt-24">
              <WaitlistForm />
              <p className="mt-2 text-sm text-slate">
                Entre na lista de espera. Sem spam — só o aviso de lançamento.
              </p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <FaturaSignature />
          </div>
        </section>

        {/* Problema */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <span className="text-sm font-medium uppercase tracking-wide text-emerald">
              O problema
            </span>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold text-balance text-ink sm:text-4xl">
              A fatura sempre vem maior do que você lembrava.
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {SUSTOS.map((s) => (
                <div
                  key={s.titulo}
                  className="rounded-xl border border-line bg-paper p-6"
                >
                  <h3 className="text-lg font-semibold text-ink">{s.titulo}</h3>
                  <p className="mt-2 text-slate">{s.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <span className="text-sm font-medium uppercase tracking-wide text-emerald">
            Como funciona
          </span>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold text-balance text-ink sm:text-4xl">
            Três passos. Nenhuma planilha.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {PASSOS.map((p) => (
              <div key={p.n}>
                <span className="font-num text-2xl font-bold text-emerald">
                  {p.n}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-ink">
                  {p.titulo}
                </h3>
                <p className="mt-2 text-slate">{p.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="grid gap-6 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.titulo}
                  className="rounded-xl border border-line bg-paper p-6"
                >
                  <div className="mb-4 h-1 w-10 rounded-full bg-emerald" />
                  <h3 className="text-lg font-semibold text-ink">{f.titulo}</h3>
                  <p className="mt-2 text-slate">{f.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fake-door de preço */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-lg text-center">
            <span className="text-sm font-medium uppercase tracking-wide text-emerald">
              Acesso antecipado
            </span>
            <h2 className="mt-3 text-3xl font-bold text-balance text-ink sm:text-4xl">
              Vagas de fundador
            </h2>
            <p className="mt-3 text-slate">
              Quem entrar primeiro garante preço vitalício de fundador. Você não
              paga agora — só garante a vaga e o preço.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-emerald/30 bg-white p-8 shadow-[0_1px_2px_rgba(11,18,32,.06),0_8px_24px_rgba(11,18,32,.06)]">
            <div className="flex items-baseline gap-3">
              <span className="font-num text-4xl font-bold text-ink">R$ 89</span>
              <span className="text-slate">/ ano</span>
              <span className="font-num text-sm text-slate line-through">
                R$ 119
              </span>
            </div>
            <ul className="mt-6 space-y-3">
              {PLANO.map((item) => (
                <li key={item} className="flex items-center gap-3 text-ink">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-soft text-xs text-emerald">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <WaitlistForm
                intent="founder"
                priceShown={FOUNDER_PRICE}
                ctaLabel="Quero o Plano Fundador"
                className="flex-col"
              />
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-line bg-ink">
          <div className="mx-auto w-full max-w-3xl px-6 py-20 text-center">
            <h2 className="text-3xl font-bold text-balance text-white sm:text-4xl">
              Pare de ser pego de surpresa pela fatura.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-white/70">
              Entre na lista e seja um dos primeiros a controlar o cartão pelo
              WhatsApp.
            </p>
            <div className="mx-auto mt-8 max-w-md">
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-slate">
        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display font-semibold text-ink">CartãoZap</span>
          <p className="max-w-md sm:text-right">
            Produto em validação — ainda não é um serviço financeiro. Usamos seu
            email apenas para avisar sobre o lançamento.
          </p>
        </div>
      </footer>
    </>
  );
}
