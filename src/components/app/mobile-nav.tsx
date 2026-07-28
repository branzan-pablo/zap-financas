"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import { NAV, CONFIG, isActive, type NavItem } from "./nav-items";

/**
 * Navegação mobile (bottom tab bar + folha "Mais").
 *
 * Visível só abaixo de `md`. As 4 seções de uso diário ficam nas abas; o resto
 * (Contas, Metas, Configurações, Sair) entra na folha "Mais". O estado ativo
 * usa a pílula `emerald-soft` — mesma linguagem da sidebar do desktop.
 */

// Abas diretas (ordem = posição na barra). As demais seções vão para "Mais".
const TABS = [NAV[0], NAV[2], NAV[3], NAV[5]]; // Início, Transações, Cartões, Investimentos
const MAIS = [NAV[1], NAV[6], NAV[4], CONFIG]; // Contas, Orçamentos, Metas, Configurações
const MAIS_HREFS = MAIS.map((i) => i.href);

export function MobileNav() {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);
  const [pending, startTransition] = useTransition();

  const maisAtivo = MAIS_HREFS.some((h) => isActive(pathname, h));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegação principal"
      >
        <ul className="grid grid-cols-5">
          {TABS.map((item) => (
            <TabButton
              key={item.href}
              item={item}
              ativo={isActive(pathname, item.href)}
            />
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMaisAberto(true)}
              aria-haspopup="dialog"
              aria-expanded={maisAberto}
              className="flex w-full flex-col items-center gap-0.5 py-2"
            >
              <Pílula ativo={maisAtivo || maisAberto}>
                <Menu className="size-5" />
              </Pílula>
              <Rótulo ativo={maisAtivo || maisAberto}>Mais</Rótulo>
            </button>
          </li>
        </ul>
      </nav>

      {maisAberto && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mais opções"
        >
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMaisAberto(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />
            <ul className="space-y-1">
              {MAIS.map(({ href, label, Icon }) => {
                const ativo = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMaisAberto(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors",
                        ativo
                          ? "bg-emerald-soft text-[#0a6e44]"
                          : "text-ink hover:bg-paper"
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2 border-t border-line pt-2">
              <button
                type="button"
                onClick={() => startTransition(() => signOut())}
                disabled={pending}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-slate transition-colors hover:bg-paper disabled:opacity-50"
              >
                <LogOut className="size-5 shrink-0" />
                {pending ? "Saindo…" : "Sair"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({ item, ativo }: { item: NavItem; ativo: boolean }) {
  const { href, label, Icon } = item;
  return (
    <li>
      <Link
        href={href}
        aria-current={ativo ? "page" : undefined}
        className="flex flex-col items-center gap-0.5 py-2"
      >
        <Pílula ativo={ativo}>
          <Icon className="size-5" />
        </Pílula>
        <Rótulo ativo={ativo}>{label}</Rótulo>
      </Link>
    </li>
  );
}

/** Ícone dentro da pílula emerald-soft quando ativo (assinatura visual). */
function Pílula({ ativo, children }: { ativo: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "grid size-9 place-items-center rounded-full transition-colors",
        ativo ? "bg-emerald-soft text-[#0a6e44]" : "text-slate"
      )}
    >
      {children}
    </span>
  );
}

function Rótulo({ ativo, children }: { ativo: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "text-[11px] leading-none",
        ativo ? "font-medium text-[#0a6e44]" : "text-slate"
      )}
    >
      {children}
    </span>
  );
}
