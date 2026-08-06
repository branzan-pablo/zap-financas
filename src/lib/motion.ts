/**
 * Tokens de movimento.
 *
 * O app já tinha uma assinatura de movimento em CSS — `cz-rise`, `cz-bar` e
 * `.tour-holofote` todos usam `cubic-bezier(0.22, 1, 0.36, 1)`. Esse easing tem
 * nome no vocabulário do anime.js: `outQuint`. São a MESMA curva, então JS e CSS
 * não divergem — é por isso que estes tokens existem em vez de cada componente
 * escolher o seu.
 *
 * Duas réguas de movimento, de propósito:
 * - landing (`app/page.tsx`, `components/landing/**`) — é vitrine, pode falar alto;
 * - app (`app/(app)/**`) — é utilitário. O usuário vem checar saldo, não assistir.
 *
 * Ver a posição de design em globals.css: fora a tira de cupom, o app é
 * silencioso de propósito.
 */

/** `cubic-bezier(0.22, 1, 0.36, 1)` — a curva da casa. */
export const EASE = "outQuint";

/** Durações em ms, espelhando as animações CSS já existentes. */
export const DUR = {
  /** `cz-rise` — entrada de bloco. */
  rise: 700,
  /** `cz-bar` — preenchimento de barra. */
  bar: 900,
  /** Contagem de número. Mesma família das outras; nada aqui deve sobrar. */
  num: 900,
} as const;
