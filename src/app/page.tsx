import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { FaturaSignature } from "@/components/landing/fatura-signature";
import { WhatsappMockup } from "@/components/landing/whatsapp-mockup";
import { Pricing } from "@/components/landing/pricing";

const SUSTOS = [
  {
    kicker: "a armadilha",
    titulo: "Parcelas escondidas",
    texto:
      "Aquele “10x sem juros” de meses atrás ainda está comendo sua fatura, e você nem lembra dele.",
  },
  {
    kicker: "o susto",
    titulo: "O fechamento",
    texto:
      "Você só descobre o tamanho real da fatura quando ela fecha. Aí já não dá pra fazer nada.",
  },
  {
    kicker: "o futuro",
    titulo: "Sem visibilidade",
    texto:
      "Quanto dos seus próximos 6 meses você já comprometeu em parcelas? A maioria não faz ideia.",
  },
];

const PASSOS = [
  {
    n: "01",
    titulo: "Manda no zap",
    texto: "“Comprei uma TV em 10x de 300.” Pronto. Registrado, com as parcelas.",
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
  { nome: "Fatura projetada", valor: "em tempo real" },
  { nome: "Mapa de parcelas", valor: "6 meses à frente" },
  { nome: "Alerta de fechamento", valor: "no WhatsApp" },
  { nome: "Captura por mensagem", valor: "fala e registra" },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-num text-xs font-medium uppercase tracking-[0.18em] text-emerald">
      {children}
    </span>
  );
}

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
        <section className="relative overflow-hidden">
          <div
            className="hero-glow pointer-events-none absolute inset-0 -z-10"
            aria-hidden="true"
          />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-12 pb-24 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-20">
            <div>
              <Badge
                variant="secondary"
                className="bg-emerald-soft font-num text-xs tracking-wide text-[#0a6e44]"
              >
                Controle de cartão · pelo WhatsApp
              </Badge>
              <h1 className="mt-6 text-[2.6rem] leading-[1.02] font-bold tracking-tight text-balance text-ink sm:text-6xl">
                Saiba sua fatura
                <br />
                <span className="text-emerald">antes</span> dela fechar.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-slate">
                Registre suas compras (até as parceladas) mandando uma
                mensagem. O CartãoZap mostra sua fatura projetada e quanto você
                já comprometeu nos próximos meses.
              </p>

              <div id="lista" className="mt-8 max-w-md scroll-mt-24">
                <WaitlistForm />
                <p className="mt-2.5 text-sm text-slate">
                  Lista de espera · sem spam, só o aviso de lançamento.
                </p>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <FaturaSignature />
            </div>
          </div>
        </section>

        {/* Problema — colunas editoriais com hairline (sem caixas) */}
        <section className="border-t border-line bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
            <Eyebrow>O problema</Eyebrow>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-balance text-ink sm:text-[2.5rem] sm:leading-[1.1]">
              A fatura sempre vem maior do que você lembrava.
            </h2>
            <div className="mt-14 grid gap-y-10 sm:grid-cols-3 sm:gap-x-0">
              {SUSTOS.map((s, i) => (
                <div
                  key={s.titulo}
                  className={cn(
                    "sm:px-8",
                    i === 0 && "sm:pl-0",
                    i > 0 && "sm:border-l sm:border-line"
                  )}
                >
                  <Eyebrow>{s.kicker}</Eyebrow>
                  <h3 className="mt-3 text-xl font-semibold text-ink">
                    {s.titulo}
                  </h3>
                  <p className="mt-2 leading-relaxed text-slate">{s.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona — sequência 01/02/03 */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
          <Eyebrow>Como funciona</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-balance text-ink sm:text-[2.5rem] sm:leading-[1.1]">
            Três passos. Nenhuma planilha.
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {PASSOS.map((p) => (
              <div key={p.n} className="border-t border-ink/15 pt-5">
                <span className="font-num text-2xl font-bold text-emerald">
                  {p.n}
                </span>
                <h3 className="mt-3 text-xl font-semibold text-ink">
                  {p.titulo}
                </h3>
                <p className="mt-2 leading-relaxed text-slate">{p.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WhatsApp — canal principal em destaque */}
        <section className="border-y border-line bg-emerald-soft/30">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
            <div>
              <Eyebrow>No WhatsApp</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-ink sm:text-[2.5rem] sm:leading-[1.1]">
                Tão simples quanto mandar uma mensagem.
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-slate">
                Sem abrir app, sem planilha. Você fala, o CartãoZap registra a
                compra, calcula as parcelas e te diz a fatura na hora, tudo na
                conversa que você já usa o dia inteiro.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Funciona por texto ou áudio",
                  "Resposta na hora, sem abrir app",
                  "Parcelas calculadas sozinhas",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-ink">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white text-xs text-emerald">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center lg:justify-end">
              <WhatsappMockup />
            </div>
          </div>
        </section>

        {/* Features — painel único estilo extrato (motivo-assinatura) */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
            <div>
              <Eyebrow>Na palma da mão</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-ink sm:text-[2.5rem] sm:leading-[1.1]">
                Tudo que importa do seu cartão, num lugar só.
              </h2>
              <p className="mt-4 max-w-sm leading-relaxed text-slate">
                Sem abrir cinco apps de banco. Sem somar parcela na cabeça. O
                número certo, na hora certa.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-6 shadow-[0_1px_2px_rgba(11,18,32,.05),0_12px_32px_rgba(11,18,32,.05)] sm:p-8">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-num text-xs uppercase tracking-[0.18em] text-slate">
                  Incluído
                </span>
                <span className="size-2 rounded-full bg-emerald" />
              </div>
              <ul className="divide-y divide-line">
                {FEATURES.map((f) => (
                  <li key={f.nome} className="flex items-center py-3.5">
                    <span className="text-ink">{f.nome}</span>
                    <span className="ledger-leader" aria-hidden="true" />
                    <span className="font-num text-sm text-emerald">
                      {f.valor}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Preço — toggle Mensal/Trimestral/Anual */}
        <Pricing checkoutUrl={process.env.NEXT_PUBLIC_FOUNDER_CHECKOUT_URL} />

        {/* CTA final */}
        <section className="bg-ink">
          <div className="mx-auto w-full max-w-3xl px-6 py-20 text-center sm:py-24">
            <h2 className="text-3xl font-bold tracking-tight text-balance text-white sm:text-[2.5rem] sm:leading-[1.1]">
              Pare de ser pego de surpresa pela fatura.
            </h2>
            <p className="mx-auto mt-4 max-w-md leading-relaxed text-white/70">
              Entre na lista e seja um dos primeiros a controlar o cartão pelo
              WhatsApp.
            </p>
            <div className="mx-auto mt-8 max-w-md">
              <WaitlistForm onDark />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-slate">
        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display font-semibold text-ink">CartãoZap</span>
          <p className="max-w-md sm:text-right">
            Produto em validação. Ainda não é um serviço financeiro. Usamos seu
            email apenas para avisar sobre o lançamento.
          </p>
        </div>
      </footer>
    </>
  );
}
