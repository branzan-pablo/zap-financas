import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FaturaSignature } from "@/components/landing/fatura-signature";
import { WhatsappMockup } from "@/components/landing/whatsapp-mockup";
import { Pricing } from "@/components/landing/pricing";

const SUSTOS = [
  {
    kicker: "o dia a dia",
    titulo: "Dinheiro sumindo",
    texto:
      "No fim do mês o saldo não fecha e você não faz ideia de onde o dinheiro foi parar.",
  },
  {
    kicker: "o susto",
    titulo: "A fatura fecha maior",
    texto:
      "Parcelas escondidas de meses atrás ainda comendo sua fatura — e você só vê o tamanho real quando fecha.",
  },
  {
    kicker: "o caos",
    titulo: "Cinco apps abertos",
    texto:
      "Conta num banco, cartão em outro, investimento num terceiro. Ninguém tem o número real na mão.",
  },
];

const PASSOS = [
  {
    n: "01",
    titulo: "Conecte seus bancos",
    texto:
      "Via Open Finance: 100+ bancos, só leitura, sem dar senha pra ninguém. Zero digitação.",
  },
  {
    n: "02",
    titulo: "A IA organiza tudo",
    texto:
      "Transações categorizadas sozinhas, fatura projetada, parcelas futuras e investimentos consolidados.",
  },
  {
    n: "03",
    titulo: "Pergunte no WhatsApp",
    texto:
      "“Qual meu saldo?”, “Como está a fatura?” — resposta em segundos, e alertas antes de estourar.",
  },
];

const FAQ = [
  {
    q: "Como funciona a conexão com o banco?",
    a: "Via Open Finance — o mesmo padrão regulado pelo Banco Central que os próprios bancos usam. A conexão é somente leitura: você nunca compartilha a senha do banco conosco, e autoriza (ou revoga) o acesso quando quiser.",
  },
  {
    q: "Meus dados financeiros estão seguros?",
    a: "Sim. Dados isolados por usuário e criptografados, acesso apenas por leitura via Open Finance, e nunca vendemos nem compartilhamos suas informações. Todo cálculo financeiro roda no nosso servidor, não no seu aparelho.",
  },
  {
    q: "Funciona com o meu banco?",
    a: "Mais de 100 bancos e cartões via Open Finance — Nubank, Itaú, Bradesco, Inter, C6, Santander e muitos outros. Contas, cartões e investimentos, tudo em um lugar só.",
  },
  {
    q: "Preciso baixar algum app?",
    a: "Não. Funciona no navegador e responde pelo WhatsApp que você já usa todo dia. Sem loja de aplicativos, sem planilha.",
  },
  {
    q: "Quando vou ter acesso?",
    a: "Estamos finalizando os últimos detalhes. Quem entra na lista é avisado primeiro, por email, e garante o preço de fundador travado.",
  },
  {
    q: "Posso cancelar?",
    a: "Pode, quando quiser. E você começa com 14 dias grátis, com tudo liberado — sem precisar de cartão para testar.",
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
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}
          >
            Entrar
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ variant: "default" }))}>
            Criar conta
          </Link>
        </div>
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
                Open Finance · IA · WhatsApp
              </Badge>
              <h1 className="mt-6 text-[2.6rem] leading-[1.04] font-bold tracking-tight text-balance text-ink sm:text-6xl">
                Suas finanças inteiras, no{" "}
                <span className="text-emerald">WhatsApp</span>.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-slate">
                Conecte seus bancos via Open Finance, deixe a IA categorizar
                tudo e entenda para onde vai seu dinheiro — em segundos, pela
                conversa que você já usa todo dia.
              </p>

              <div className="mt-8 max-w-md">
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full font-semibold sm:w-auto"
                  )}
                >
                  Criar conta grátis
                </Link>
                <p className="mt-2.5 text-sm text-slate">
                  14 dias grátis · sem cartão de crédito · cancele quando quiser.
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
              No fim do mês, o dinheiro some e ninguém sabe por quê.
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
                Todas as suas finanças, num lugar só.
              </h2>
              <p className="mt-4 max-w-sm leading-relaxed text-slate">
                Sem abrir cinco apps de banco. Sem somar parcela na cabeça. O
                número certo, na hora certa.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Saldo, fatura projetada e investimentos consolidados",
                  "Categorização automática por IA e mapa de parcelas",
                  "Limite seguro do mês e alertas no WhatsApp",
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
        <Pricing />

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
              Conecte seus bancos hoje e veja a fatura se formando antes de ela
              fechar.
            </p>
            <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full bg-emerald-bright font-semibold text-white hover:bg-emerald sm:w-auto"
                )}
              >
                Criar conta grátis
              </Link>
              <p className="text-sm text-white/60">
                14 dias grátis · sem cartão de crédito
              </p>
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
