"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Intent = "waitlist" | "founder";

type Props = {
  intent?: Intent;
  priceShown?: string;
  ctaLabel?: string;
  className?: string;
  /** When set (founder intent), redirect to this checkout URL after saving the lead. */
  checkoutUrl?: string;
  /** Style the CTA for a dark background (ink button would be invisible there). */
  onDark?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm({
  intent = "waitlist",
  priceShown,
  ctaLabel,
  className,
  checkoutUrl,
  onDark,
}: Props) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot: humans never fill this
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  const emailValid = EMAIL_RE.test(email.trim());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || status === "loading") return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          hp,
          wants_founder: intent === "founder",
          price_shown: priceShown ?? null,
          source:
            typeof window !== "undefined"
              ? window.location.search.slice(0, 120)
              : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data?.error ?? "Algo deu errado. Tente de novo.");
        return;
      }
      // Founder pre-sale: lead saved, now send them to checkout (Pix/cartão).
      if (intent === "founder" && checkoutUrl) {
        track("checkout_started", { intent });
        window.location.href = checkoutUrl;
        return;
      }
      track("signup", { intent }); // conversion event for Vercel Analytics
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Sem conexão. Tente de novo.");
    }
  }

  if (status === "done") {
    return (
      <div
        className={cn(
          "rounded-xl border border-emerald/30 bg-emerald-soft px-5 py-4 text-sm",
          className
        )}
        role="status"
      >
        <p className="font-medium text-[#0a6e44]">Pronto, você está na lista! 🎉</p>
        <p className="mt-1 text-slate">
          {intent === "founder"
            ? "Avisamos você primeiro quando as vagas de fundador abrirem."
            : "Te avisamos assim que o acesso abrir. Sem spam."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-2", className)} noValidate>
      {/* Honeypot — hidden from humans, catches naive bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`email-${intent}`} className="sr-only">
          Seu email
        </label>
        <Input
          id={`email-${intent}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          className="h-12 flex-1 bg-white text-base"
          aria-invalid={status === "error"}
        />
        <Button
          type="submit"
          disabled={!emailValid || status === "loading"}
          className={cn(
            "h-12 px-6 text-base font-semibold",
            onDark && "bg-emerald-bright text-white hover:bg-emerald"
          )}
        >
          {status === "loading" ? "Enviando…" : ctaLabel ?? "Entrar na lista"}
        </Button>
      </div>

      {status === "error" && (
        <p role="alert" className="text-sm text-[#b4540a]">
          {error}
        </p>
      )}
    </form>
  );
}
