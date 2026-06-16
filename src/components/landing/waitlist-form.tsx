"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Intent = "waitlist" | "founder";

type Props = {
  intent?: Intent;
  priceShown?: string;
  ctaLabel?: string;
  className?: string;
};

export function WaitlistForm({
  intent = "waitlist",
  priceShown,
  ctaLabel,
  className,
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
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
    <form
      onSubmit={onSubmit}
      className={cn("flex flex-col gap-2 sm:flex-row", className)}
      noValidate
    >
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
        onChange={(e) => setEmail(e.target.value)}
        className="h-12 flex-1 bg-white text-base"
        aria-invalid={status === "error"}
      />
      <Button
        type="submit"
        disabled={status === "loading"}
        className="h-12 px-6 text-base font-semibold"
      >
        {status === "loading"
          ? "Enviando…"
          : ctaLabel ?? "Entrar na lista"}
      </Button>
      {status === "error" && (
        <p
          role="alert"
          className="w-full text-sm text-[#b4540a] sm:order-last"
        >
          {error}
        </p>
      )}
    </form>
  );
}
