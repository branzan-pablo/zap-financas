import {
  House,
  Landmark,
  ArrowRightLeft,
  CreditCard,
  Target,
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

/** Seções principais do app, em ordem de prioridade. */
export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Início", Icon: House },
  { href: "/contas", label: "Contas", Icon: Landmark },
  { href: "/transacoes", label: "Transações", Icon: ArrowRightLeft },
  { href: "/cartoes", label: "Cartões", Icon: CreditCard },
  { href: "/metas", label: "Metas", Icon: Target },
  { href: "/investimentos", label: "Investimentos", Icon: TrendingUp },
  { href: "/orcamentos", label: "Orçamentos", Icon: Wallet },
  { href: "/fechamento", label: "Fechamento", Icon: CalendarCheck },
];

export const CONFIG: NavItem = {
  href: "/configuracoes",
  label: "Configurações",
  Icon: Settings,
};

/** True se `pathname` está na seção de `href` (rota exata ou subrota). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
