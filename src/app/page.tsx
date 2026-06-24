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

const FAQ = [
  {
    q: "Meus dados financeiros estão seguros?",
    a: "Sim. Tratamos seus dados com cuidado de banco: tudo criptografado, acesso restrito e nunca vendemos nem compartilhamos suas informações. Você controla o que registra.",
  },
  {
    q: "Preciso conectar a conta do meu banco?",
    a: "Não. Você registra suas compras pelo WhatsApp ou importa a fatura. Sem dar a senha do seu banco pra ninguém.",
  },
  {
    q: "Funciona com qualquer cartão?",
    a: "Sim. Como é você quem registra as compras, funciona com qualquer cartão, de qualquer banco.",
  },
  {
    q: "É seguro usar pelo WhatsApp?",
    a: "Sim. Você compartilha só o que quiser, na conversa que já usa todo dia, e seus dados ficam protegidos do nosso lado.",
  },
  {
    q: "Quando vou ter acesso?",
    a: "Estamos finalizando os últimos detalhes. Quem entra como fundador é avisado primeiro, por email, assim que o acesso abrir.",
  },
  {
    q: "Posso cancelar?",
    a: "Pode, quando quiser. E você tem 7 dias de garantia: se não curtir, devolvemos seu dinheiro.",
  },
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
            Z
          </span>
          Zap Finanças
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
                Controle de cartão simplificado
              </Badge>
              <h1 className="mt-6 text-[2.6rem] leading-[1.04] font-bold tracking-tight text-balance text-ink sm:text-6xl">
                Seu assistente de cartão no{" "}
                <span className="text-emerald">WhatsApp</span>.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-slate">
                Registre compras por mensagem, acompanhe a fatura projetada e
                seja avisado antes de fechar. Sem planilha, sem baixar nenhum
                app.
              </p>

              <div id="lista" className="mt-8 max-w-md scroll-mt-24">
                <WaitlistForm />
                <p className="mt-2.5 text-sm text-slate">
                  Lista de espera · sem spam, só o aviso de lançamento.
                </p>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <WhatsappMockup />
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

        {/* Features — card de fatura projetada */}
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
              <ul className="mt-6 space-y-3">
                {[
                  "Fatura projetada em tempo real",
                  "Mapa das parcelas dos próximos meses",
                  "Alerta no WhatsApp antes de fechar",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-ink">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-soft text-xs text-emerald">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center lg:justify-end">
              <FaturaSignature />
            </div>
          </div>
        </section>

        {/* Nota do fundador — confiança */}
        <section className="border-t border-line bg-white">
          <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-24">
            <Eyebrow>Quem está por trás</Eyebrow>
            <figure className="mt-6">
              <blockquote className="text-xl leading-relaxed text-balance text-ink sm:text-2xl sm:leading-relaxed">
                “Criei o Zap Finanças depois de tomar susto com a fatura mais
                vezes do que admito. Eu não ganhava mal, só não enxergava onde
                o dinheiro estava indo. Queria a verdade das minhas finanças em
                segundos, pelo WhatsApp que já uso todo dia. Como não existia do
                jeito que eu queria, resolvi construir.”
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4">
                {/* Troque por uma foto real em public/founder.jpg para mais confiança */}
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink font-display text-lg font-bold text-white">
                  P
                </span>
                <div>
                  <p className="font-semibold text-ink">Pablo</p>
                  <p className="text-sm text-slate">Fundador do Zap Finanças</p>
                </div>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Preço — toggle Mensal/Trimestral/Anual */}
        <Pricing checkoutUrl={process.env.NEXT_PUBLIC_FOUNDER_CHECKOUT_URL} />

        {/* FAQ — quebra de objeções */}
        <section className="border-t border-line bg-white">
          <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-24">
            <Eyebrow>Perguntas frequentes</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-ink sm:text-[2.5rem] sm:leading-[1.1]">
              Ainda com alguma dúvida?
            </h2>
            <div className="mt-10">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group border-b border-line py-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-ink [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-soft text-emerald transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl leading-relaxed text-slate">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

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
          <span className="font-display font-semibold text-ink">Zap Finanças</span>
          <p className="max-w-md sm:text-right">
            Produto em validação. Ainda não é um serviço financeiro. Usamos seu
            email apenas para avisar sobre o lançamento.
          </p>
        </div>
      </footer>
    </>
  );
}
