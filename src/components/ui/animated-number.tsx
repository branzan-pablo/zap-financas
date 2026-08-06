"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, createScope, type Scope } from "animejs";

import { formatBRL } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";

/**
 * Número que conta até o valor final.
 *
 * É o ÚNICO módulo do repo que importa `animejs`, e existe por um motivo
 * específico: CSS não sabe interpolar um número ATRAVÉS de um formatador. Uma
 * transição CSS anima `2180` como pixels ou opacidade, não como
 * "R$ 1.240" → "R$ 2.180" com separador de milhar. Para isso é preciso tweenar
 * um número em JS e reformatar a cada frame — que é exatamente o que
 * `animate({ n: 0 }, …)` faz, já que o anime.js aceita objetos JS como alvo.
 *
 * Tudo que CSS já resolve continua em CSS: as barras usam `cz-bar`, as entradas
 * usam `cz-rise`, e os modais usam `tw-animate-css`. Nada disso passa por aqui.
 *
 * ## Progressive enhancement
 * O SSR pinta o valor FINAL já formatado. Se o JS não carregar, falhar ou for
 * bloqueado, o número correto continua na tela — a animação é enfeite, nunca o
 * caminho pelo qual o dado chega. É por isso que a contagem começa em
 * `useLayoutEffect`: escrever o valor inicial antes do primeiro paint evita o
 * flash de "valor final → 0 → conta de novo".
 *
 * ## Quando conta
 * Se o elemento já está em tela na montagem, conta imediatamente. Se está
 * abaixo da dobra, espera entrar no viewport — senão a animação terminaria
 * muito antes de alguém rolar até ela, e ninguém veria nada. Isso é
 * "começar quando aparece", não paralaxe: nada se move em função do scroll.
 *
 * ## Acessibilidade
 * O texto que muda 60× por segundo é `aria-hidden`; um irmão `sr-only` carrega
 * o valor final estável. Sem isso, um leitor de tela tentaria narrar a contagem
 * inteira.
 */

// `useLayoutEffect` avisa no SSR. No servidor não há paint para sincronizar,
// então cair para `useEffect` lá é correto — e no cliente ganhamos o frame.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Formatadores nomeados em vez de uma prop `(n: number) => string`.
 *
 * Não é preciosismo: quem chama este componente é server component, e função
 * não atravessa a fronteira RSC ("Functions cannot be passed directly to Client
 * Components"). Um nome atravessa; a função mora aqui, do lado do cliente.
 *
 * Todos são `Intl` cacheados no módulo — rodam a cada frame da contagem.
 */
const INTEIRO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

const FORMATOS = {
  /** "R$ 1.234,50" — o padrão do app, com centavos. */
  brl: formatBRL,
  /** "R$ 2.180" — sem centavos, com nbsp colando o símbolo no número. */
  inteiro: (n: number) => `R$ ${INTEIRO.format(Math.round(n))}`,
  /** "73" — número cru, para score e contagens. */
  cru: (n: number) => INTEIRO.format(Math.round(n)),
} as const;

export type FormatoNumero = keyof typeof FORMATOS;

export function AnimatedNumber({
  valor,
  de = 0,
  formato = "brl",
  duracao = DUR.num,
  atraso = 0,
  className,
}: {
  /** Valor final. É ele que o SSR pinta e o que o leitor de tela anuncia. */
  valor: number;
  /** Valor de partida da contagem. */
  de?: number;
  /** Como o número vira texto. String, não função — a prop cruza o RSC. */
  formato?: FormatoNumero;
  duracao?: number;
  /** Atraso em ms, para escalonar com as animações CSS vizinhas. */
  atraso?: number;
  className?: string;
}) {
  const formatar = FORMATOS[formato];
  const ref = useRef<HTMLSpanElement>(null);
  const scopeRef = useRef<Scope | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const scope = createScope({
      root: ref,
      // O anime.js resolve a media query e expõe o resultado em `scope.matches`.
      mediaQueries: { reduzido: "(prefers-reduced-motion: reduce)" },
    }).add((self) => {
      // Sob movimento reduzido não fazemos NADA: o valor final já está no DOM
      // desde o SSR, então não animar é o comportamento correto — não há estado
      // a restaurar.
      if (self?.matches.reduzido) return;

      const contar = () => {
        const estado = { n: de };
        el.textContent = formatar(de);

        animate(estado, {
          n: valor,
          duration: duracao,
          delay: atraso,
          ease: EASE,
          onUpdate: () => {
            el.textContent = formatar(estado.n);
          },
          // Garante que o último frame seja exatamente o valor final, e não um
          // arredondamento a 0,3 centavo de distância.
          onComplete: () => {
            el.textContent = formatar(valor);
          },
        });
      };

      // Já visível? Conta agora, ainda dentro do layout effect — antes do
      // primeiro paint, então não há flash de "valor final → 0".
      const r = el.getBoundingClientRect();
      const visivel = r.top < window.innerHeight && r.bottom > 0;
      if (visivel) {
        contar();
        return;
      }

      // Abaixo da dobra: contar na montagem seria desperdício — a animação
      // acabaria muito antes de alguém rolar até lá. Espera entrar em tela.
      // `IntersectionObserver` é nativo, então isso não cresce o bundle.
      const observer = new IntersectionObserver(
        (entradas) => {
          if (!entradas.some((e) => e.isIntersecting)) return;
          observer.disconnect();
          contar();
        },
        { threshold: 0.35 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    });

    scopeRef.current = scope;
    return () => {
      scope.revert();
      scopeRef.current = null;
    };
  }, [valor, de, formatar, duracao, atraso]);
  // `formatar` vem de um objeto congelado no módulo, então é estável entre
  // renders — está nas deps por correção, não porque mude.

  const textoFinal = formatar(valor);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true">
        {textoFinal}
      </span>
      <span className="sr-only">{textoFinal}</span>
    </span>
  );
}
