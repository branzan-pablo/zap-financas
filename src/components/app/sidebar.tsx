"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import { useTransition } from "react";

const NAV = [
  { href: "/dashboard",      label: "Dashboard",     icon: "⬡" },
  { href: "/contas",         label: "Contas",         icon: "🏦" },
  { href: "/transacoes",     label: "Transações",     icon: "↕" },
  { href: "/cartoes",        label: "Cartões",        icon: "💳" },
  { href: "/metas",          label: "Metas",          icon: "🎯" },
  { href: "/investimentos",  label: "Investimentos",  icon: "📈" },
];

export function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(() => signOut());
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-line bg-white">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4">
        <span className="grid size-7 place-items-center rounded-lg bg-emerald text-xs font-bold text-white">
          Z
        </span>
        <span className="font-display text-base font-bold text-ink">
          Zap Finanças
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-soft text-[#0a6e44]"
                      : "text-slate hover:bg-paper hover:text-ink"
                  )}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-line pt-4">
          <Link
            href="/configuracoes"
            className={cn(
              "flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/configuracoes")
                ? "bg-emerald-soft text-[#0a6e44]"
                : "text-slate hover:bg-paper hover:text-ink"
            )}
          >
            <span className="text-base leading-none" aria-hidden>⚙</span>
            Configurações
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="shrink-0 border-t border-line p-3">
        <div className="flex items-center justify-between gap-2 rounded-[10px] px-2 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink font-display text-xs font-bold text-white">
              {userName ? userName[0].toUpperCase() : "U"}
            </span>
            <span className="truncate text-sm font-medium text-ink">
              {userName ?? "Usuário"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
            title="Sair"
            className="shrink-0 rounded-lg p-1 text-slate hover:bg-paper hover:text-ink disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
