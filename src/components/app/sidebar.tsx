"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import { NAV, CONFIG, isActive } from "./nav-items";

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
      <nav data-tour="nav" className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-soft text-emerald-ink"
                      : "text-slate hover:bg-paper hover:text-ink"
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-line pt-4">
          <Link
            href={CONFIG.href}
            aria-current={isActive(pathname, CONFIG.href) ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
              isActive(pathname, CONFIG.href)
                ? "bg-emerald-soft text-emerald-ink"
                : "text-slate hover:bg-paper hover:text-ink"
            )}
          >
            <CONFIG.Icon className="size-[18px] shrink-0" />
            {CONFIG.label}
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
            aria-label="Sair da conta"
            className="shrink-0 rounded-lg p-1 text-slate hover:bg-paper hover:text-ink disabled:opacity-50"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}
