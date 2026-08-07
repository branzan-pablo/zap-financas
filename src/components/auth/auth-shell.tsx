"use client";

import * as React from "react";
import { Check, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { REGRAS_SENHA } from "@/lib/auth/validacao";
import { Card } from "@/components/ui/card";

/**
 * Peças compartilhadas das quatro telas de autenticação.
 *
 * Login, cadastro, "esqueci a senha" e "nova senha" eram quatro cópias do mesmo
 * cartão elevado, do mesmo divisor "ou", do mesmo banner de erro e do mesmo
 * botão do Google com o SVG inteiro repetido — ~120 linhas de duplicata que
 * divergiam a cada retoque.
 */

/** O cartão que É a tela de auth. */
export function AuthCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-sm">
      <Card padding="none" elevated className={cn("p-8", className)}>
        {children}
      </Card>
    </div>
  );
}

/** Esqueleto do cartão enquanto o `Suspense` resolve. */
export function AuthCardSkeleton() {
  return (
    <div className="w-full max-w-sm">
      <Card padding="none" elevated className="h-96 animate-pulse p-8" />
    </div>
  );
}

/** Título da tela de auth — aqui o cartão é a página, então é sempre `h1`. */
export function AuthTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display text-2xl font-bold text-ink">{children}</h1>;
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="mt-4 rounded-lg border border-amber/30 bg-amber-soft px-4 py-3 text-sm text-ink"
    >
      {children}
    </div>
  );
}

/**
 * Login com Google — DESLIGADO até termos o Custom Domain do Supabase.
 *
 * O provider está configurado e funcionando (credenciais no Supabase, app em
 * produção no Google Cloud). O problema é a tela de consentimento: o Google
 * exibe o domínio raiz da URL de callback, e a do Supabase é
 * `<project-ref>.supabase.co`. O usuário lê "para continuar em
 * vtbpadfrguerropwwdbj.supabase.co" na hora de entregar a conta Google —
 * num app financeiro isso queima confiança e, pior, treina a pessoa a aceitar
 * domínios estranhos nesse momento, que é o que o phishing explora.
 *
 * Não há correção gratuita: o nome do app no consent screen não substitui o
 * domínio. A solução é o Custom Domain do Supabase (US$ 10/mês + plano Pro),
 * que faz o callback virar `auth.zapfinancas.com.br`.
 *
 * PARA RELIGAR: contrate o Custom Domain, aponte o client Supabase para ele, e
 * troque esta constante para `true`. O resto do código continua no lugar.
 */
export const GOOGLE_LOGIN_HABILITADO: boolean = false;

/** Divisor "ou" entre o formulário e o login social. */
export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-line" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-2 text-xs text-slate">ou</span>
      </div>
    </div>
  );
}

/** Botão "Continuar com Google", com o logo oficial em cores. */
export function GoogleButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-(--tap) w-full items-center justify-center gap-2.5 rounded-[10px] border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink",
        "transition-colors hover:bg-paper disabled:opacity-60"
      )}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path
          d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
          fill="#4285F4"
        />
        <path
          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
          fill="#34A853"
        />
        <path
          d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
          fill="#FBBC05"
        />
        <path
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
          fill="#EA4335"
        />
      </svg>
      Continuar com Google
    </button>
  );
}

/**
 * Botão de envio das telas de auth: largura total e rótulo que vira gerúndio
 * durante o envio ("Entrando…"), para a tela nunca parecer travada.
 */
export function AuthSubmit({
  pending,
  pendingLabel,
  className,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "min-h-(--tap) w-full rounded-[10px] bg-emerald px-4 py-2.5 font-medium text-white",
        "transition-colors hover:bg-emerald/90 disabled:opacity-60",
        className
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/**
 * Tela de "deu certo, olhe seu email" — igual no cadastro e na recuperação de
 * senha. `h1` porque, nesse estado, ela é a página inteira.
 */
export function AuthSuccess({
  icone = "✉️",
  titulo,
  descricao,
  children,
}: {
  icone?: React.ReactNode;
  titulo: React.ReactNode;
  descricao: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <AuthCard className="text-center">
      <div
        aria-hidden
        className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-emerald-soft text-2xl"
      >
        {icone}
      </div>
      <h1 className="font-display text-xl font-bold text-ink">{titulo}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate">{descricao}</p>
      {children}
    </AuthCard>
  );
}

/** Rótulo dos campos de auth — tinta, não cinza: aqui o campo é a tela. */
export function AuthLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-medium text-ink", className)}
    >
      {children}
    </label>
  );
}

/**
 * Campo de auth: mesma geometria do `.field`, com o anel de foco da marca.
 *
 * O espaçamento em relação ao rótulo mora no `AuthField`, não aqui: com o olho
 * da senha posicionado por `absolute`, uma margem no próprio input desalinharia
 * o botão em 6px.
 */
export function AuthInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "min-h-(--tap) w-full rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-slate/60",
        "focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20",
        "aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:ring-danger/20",
        "disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

/**
 * Rótulo + campo + erro, com a ligação `aria` já feita.
 *
 * O `id` é obrigatório na assinatura porque tudo aqui depende dele: o `htmlFor`
 * do rótulo, o `id` do parágrafo de erro e o `aria-describedby` que o controle
 * usa para apontar de volta. Quem monta o campo à mão erra um dos três.
 */
export function AuthField({
  id,
  label,
  acao,
  erro,
  descricao,
  children,
}: {
  /** Precisa bater com o `id` do controle filho. */
  id: string;
  label: React.ReactNode;
  /** Link auxiliar na linha do rótulo — o "Esqueci a senha" da tela de login. */
  acao?: React.ReactNode;
  /** Mensagem de erro. Anunciada quando aparece; some quando o campo é corrigido. */
  erro?: string;
  /** Apoio abaixo do campo (a lista de requisitos da senha, por exemplo). */
  descricao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <AuthLabel htmlFor={id}>{label}</AuthLabel>
        {acao}
      </div>
      <div className="mt-1.5">{children}</div>
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm text-danger">
          {erro}
        </p>
      )}
      {descricao}
    </div>
  );
}

/**
 * Campo de senha com o olho de mostrar/ocultar.
 *
 * Digitar 12 caracteres às cegas num teclado de celular é a receita para errar
 * a senha três vezes e desistir — por isso o olho existe. Ele começa fechado e
 * NÃO guarda estado entre campos: revelar é uma decisão pontual, tomada com a
 * tela à vista, não uma preferência que persiste.
 */
export function AuthPasswordInput({
  id,
  className,
  ...props
}: React.ComponentProps<"input"> & { id: string }) {
  const [visivel, setVisivel] = React.useState(false);

  return (
    <div className="relative">
      <AuthInput
        id={id}
        type={visivel ? "text" : "password"}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        // O rótulo diz o que o botão FAZ ao ser acionado, não em que estado
        // está — é isso que o leitor de tela anuncia quando o foco chega nele.
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
        aria-controls={id}
        // Alvo de 44px encostado na borda direita do campo: o dedo acerta sem
        // esbarrar no texto, e a área fica dentro da altura do próprio campo.
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[10px] text-slate transition-colors hover:text-ink"
      >
        {visivel ? (
          <EyeOff className="size-[18px]" aria-hidden />
        ) : (
          <Eye className="size-[18px]" aria-hidden />
        )}
      </button>
    </div>
  );
}

/**
 * Requisitos da senha em linhas de razão — rótulo · pontilhado · situação.
 *
 * Reusa o `.ledger-leader` da assinatura do app (a tira de cupom) em vez de uma
 * barra colorida de "força". Força é palpite; estes são exatamente os dois
 * testes que a action aplica, então a lista não promete o que o servidor vai
 * recusar. Aparece só depois da primeira tecla: antes disso não há o que
 * conferir, e uma lista de exigências num campo vazio é ameaça, não ajuda.
 */
export function RequisitosSenha({
  senha,
  cobrando,
  id = "requisitos-senha",
}: {
  senha: string;
  /** Depois da primeira tentativa, o que falta deixa de ser aviso e vira erro. */
  cobrando: boolean;
  id?: string;
}) {
  return (
    <ul id={id} aria-label="Requisitos da senha" className="mt-2.5 space-y-1">
      {REGRAS_SENHA.map((regra) => {
        const atende = regra.atende(senha);
        return (
          <li key={regra.id} className="flex items-baseline text-xs">
            <span
              className={
                atende
                  ? "text-emerald-ink"
                  : cobrando
                    ? "text-danger"
                    : "text-slate"
              }
            >
              {regra.rotulo}
            </span>
            <span className="ledger-leader" aria-hidden />
            <span className="sr-only">{atende ? "pronto" : "falta"}</span>
            {atende ? (
              <Check
                aria-hidden
                className="size-3.5 shrink-0 self-center text-emerald"
              />
            ) : (
              <span
                aria-hidden
                className={cn(
                  "shrink-0",
                  cobrando ? "text-danger" : "text-slate/60"
                )}
              >
                —
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Os dois modos da tela de entrada. */
export type AuthModo = "entrar" | "criar";

const ABAS: { modo: AuthModo; rotulo: string }[] = [
  { modo: "entrar", rotulo: "Entrar" },
  { modo: "criar", rotulo: "Criar conta" },
];

/**
 * Alternador entre entrar e criar conta.
 *
 * Antes, trocar de modo era uma navegação: um link "Criar conta" no meio de um
 * parágrafo, uma rota nova, o cartão inteiro repintado. Como as duas telas
 * pedem quase os mesmos campos, a navegação escondia o quanto elas são a mesma
 * coisa — e cobrava um round-trip por um engano de um clique.
 *
 * A trilha é o papel do extrato (`bg-paper`) e o modo ativo é uma folha branca
 * deslizando sobre ela: o mesmo par de superfícies do resto do app, sem
 * inventar cor nova para um controle.
 */
export function AuthSegmented({
  modo,
  onModoChange,
  desabilitado,
}: {
  modo: AuthModo;
  onModoChange: (modo: AuthModo) => void;
  desabilitado?: boolean;
}) {
  // Com exatamente duas abas, ←/Home vão para a primeira e →/End para a
  // segunda; não há ciclo a percorrer. Se um dia virarem três, isto precisa
  // virar um índice com wrap-around.
  function aoTeclar(e: React.KeyboardEvent<HTMLDivElement>) {
    const paraPrimeira = e.key === "ArrowLeft" || e.key === "Home";
    const paraSegunda = e.key === "ArrowRight" || e.key === "End";
    if (!paraPrimeira && !paraSegunda) return;
    e.preventDefault();
    const destino: AuthModo = paraPrimeira ? "entrar" : "criar";
    onModoChange(destino);
    document.getElementById(`aba-${destino}`)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Entrar ou criar conta"
      onKeyDown={aoTeclar}
      className={cn(
        "relative grid grid-cols-2 rounded-xl border border-line bg-paper p-1",
        desabilitado && "opacity-60"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-[10px] bg-white",
          "shadow-[0_1px_2px_rgba(11,18,32,.08)]",
          // 180ms na curva da casa: régua de app, não de vitrine.
          "transition-transform duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          modo === "criar" && "translate-x-full"
        )}
      />
      {ABAS.map((aba) => {
        const ativa = aba.modo === modo;
        return (
          <button
            key={aba.modo}
            id={`aba-${aba.modo}`}
            type="button"
            role="tab"
            aria-selected={ativa}
            aria-controls={`painel-${aba.modo}`}
            // Tabindex móvel: a faixa inteira é UMA parada de tabulação, e as
            // setas escolhem dentro dela. É o padrão de tablist.
            tabIndex={ativa ? 0 : -1}
            disabled={desabilitado}
            onClick={() => onModoChange(aba.modo)}
            className={cn(
              "relative min-h-(--tap) rounded-[10px] text-sm font-medium transition-colors",
              ativa ? "text-ink" : "text-slate hover:text-ink"
            )}
          >
            {aba.rotulo}
          </button>
        );
      })}
    </div>
  );
}
