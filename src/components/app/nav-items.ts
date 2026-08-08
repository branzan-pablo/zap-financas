import {
  House,
  Landmark,
  ArrowRightLeft,
  CreditCard,
  TrendingUp,
  Wallet,
  CalendarCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

/**
 * Itens de navegação compartilhados entre a Sidebar (desktop) e a MobileNav
 * (bottom tab bar). Fonte única para rótulos, rotas e ícones — garante que as
 * duas navegações nunca divirjam.
 */
export type NavItem = { href: string; label: string; Icon: LucideIcon };

/**
 * Seções principais do app, em ordem de prioridade.
 *
 * "Metas" saiu daqui junto com a rota. A página existia e dizia "em
 * desenvolvimento" — para quem paga uma assinatura, um item de menu que leva a
 * um aviso de que o recurso não existe é pior do que não ter o item. Quando as
 * metas forem entregues, a entrada volta com a rota.
 */
export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Início", Icon: House },
  { href: "/contas", label: "Contas", Icon: Landmark },
  { href: "/transacoes", label: "Transações", Icon: ArrowRightLeft },
  { href: "/cartoes", label: "Cartões", Icon: CreditCard },
  { href: "/investimentos", label: "Investimentos", Icon: TrendingUp },
  { href: "/orcamentos", label: "Orçamentos", Icon: Wallet },
  { href: "/fechamento", label: "Fechamento", Icon: CalendarCheck },
];

export const CONFIG: NavItem = {
  href: "/configuracoes",
  label: "Configurações",
  Icon: Settings,
};

/**
 * As seções que viram aba direta na navegação mobile — o resto cai na folha
 * "Mais", automaticamente.
 *
 * Declarado por ROTA, não por índice. A `MobileNav` referenciava posições
 * (`NAV[5]`, `NAV[7]`), e ao remover um item do meio da lista as abas
 * deslizavam em silêncio: "Investimentos" viraria "Orçamentos" e uma das
 * entradas viraria `undefined`. Por rota, tirar um item do `NAV` simplesmente o
 * tira das duas navegações, sem nada para lembrar de ajustar junto.
 */
export const ABAS_MOBILE = [
  "/dashboard",
  "/transacoes",
  "/cartoes",
  "/investimentos",
] as const;

/** True se `pathname` está na seção de `href` (rota exata ou subrota). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
