"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import { Button } from "@/components/ui/button";
import { concluirTour } from "@/app/(app)/tour-actions";
import { PASSOS, filtrarPassos, type LadoBalao, type PassoTour } from "@/lib/tour";

/**
 * Tour de onboarding da dashboard.
 *
 * Abre sozinho no primeiro acesso e some depois de concluído (estado em
 * `profiles.onboarding_done_at`). Pode ser refeito por `/dashboard?tour=1`.
 *
 * Ancoragem: usa o `Popover` do base-ui com a prop `anchor`, que aceita um
 * elemento arbitrário — assim apontamos para blocos que já existem na página,
 * sem precisar envolvê-los num Trigger, e ganhamos colisão/flip de graça.
 *
 * Os passos vêm de [tour.ts](../../lib/tour.ts) e são filtrados pelo que está
 * VISÍVEL: é isso que faz o mesmo tour servir a dashboard vazia e a cheia, e
 * escolher entre a sidebar (desktop) e a barra inferior (mobile).
 */

/** Primeiro elemento visível com aquele data-tour (sidebar × barra inferior). */
function resolverAlvo(alvo: string): HTMLElement | null {
  const els = document.querySelectorAll<HTMLElement>(`[data-tour="${alvo}"]`);
  for (const el of Array.from(els)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

/** Âncora colada no rodapé (barra inferior do mobile) → o balão sobe. */
function ladoDe(passo: PassoTour, el: HTMLElement | null): LadoBalao {
  if (!el) return passo.lado ?? "bottom";
  const r = el.getBoundingClientRect();
  if (r.top > window.innerHeight * 0.6) return "top";
  return passo.lado ?? "bottom";
}

function prefereMenosMovimento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Tour({ jaViu, forcado }: { jaViu: boolean; forcado: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [passos, setPassos] = useState<PassoTour[]>([]);
  const [i, setI] = useState(0);
  const [ativo, setAtivo] = useState(false);
  const [ancora, setAncora] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Monta a lista de passos uma vez, já filtrada pelo que existe na tela.
  useEffect(() => {
    if (jaViu && !forcado) return;
    // Um frame de espera garante que a dashboard já pintou seus blocos.
    const id = requestAnimationFrame(() => {
      const encontrados = filtrarPassos(PASSOS, (alvo) => resolverAlvo(alvo) !== null);
      if (encontrados.length === 0) return;
      setPassos(encontrados);
      setI(0);
      setAtivo(true);
    });
    return () => cancelAnimationFrame(id);
  }, [jaViu, forcado]);

  const passo = passos[i];

  // Resolve a âncora do passo atual e mantém o retângulo do holofote em dia.
  // Tudo acontece dentro do frame seguinte: além de evitar setState síncrono no
  // efeito, garante que o layout já assentou antes de medir o elemento.
  useEffect(() => {
    if (!ativo || !passo) return;

    let cancelado = false;
    let soltarOuvintes: (() => void) | undefined;

    const frame = requestAnimationFrame(() => {
      if (cancelado) return;

      const el = passo.alvo ? resolverAlvo(passo.alvo) : null;
      setAncora(el);
      if (!el) {
        setRect(null);
        return;
      }

      el.scrollIntoView({
        block: "center",
        behavior: prefereMenosMovimento() ? "auto" : "smooth",
      });

      const atualizar = () => setRect(el.getBoundingClientRect());
      atualizar();
      // O scroll suave leva alguns quadros: remede quando ele assenta.
      const t = window.setTimeout(atualizar, 400);
      window.addEventListener("scroll", atualizar, true);
      window.addEventListener("resize", atualizar);
      soltarOuvintes = () => {
        window.clearTimeout(t);
        window.removeEventListener("scroll", atualizar, true);
        window.removeEventListener("resize", atualizar);
      };
    });

    return () => {
      cancelado = true;
      cancelAnimationFrame(frame);
      soltarOuvintes?.();
    };
  }, [ativo, passo]);

  const encerrar = useCallback(() => {
    setAtivo(false);
    startTransition(() => {
      void concluirTour();
    });
    // Limpa o ?tour=1 para não reabrir ao recarregar.
    if (forcado) router.replace("/dashboard");
  }, [forcado, router]);

  const anterior = useCallback(() => setI((n) => Math.max(0, n - 1)), []);
  const proximo = useCallback(
    () => setI((n) => Math.min(passos.length - 1, n + 1)),
    [passos.length]
  );

  // Teclado: setas navegam, Esc sai.
  useEffect(() => {
    if (!ativo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setI((n) => Math.min(passos.length - 1, n + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setI((n) => Math.max(0, n - 1));
      } else if (e.key === "Escape") {
        e.preventDefault();
        encerrar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ativo, passos.length, encerrar]);

  if (!ativo || !passo) return null;

  const total = passos.length;
  const ultimo = i === total - 1;

  const corpo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 font-display font-bold text-ink">
          <span aria-hidden>{passo.icone}</span>
          {passo.titulo}
        </p>
        <button
          type="button"
          onClick={encerrar}
          aria-label="Pular tour"
          className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-slate transition-colors hover:bg-paper hover:text-ink"
        >
          ✕
        </button>
      </div>

      <p className="mt-1.5 text-sm leading-relaxed text-slate">{passo.descricao}</p>

      {passo.link && (
        <Link
          href={passo.link.href}
          className="mt-3 inline-block text-sm font-medium text-emerald underline underline-offset-4"
        >
          {passo.link.texto}
        </Link>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-slate" aria-live="polite">
          Passo {i + 1} de {total}
        </span>
        <div className="flex gap-2">
          {i > 0 && (
            <Button variant="outline" size="sm" onClick={anterior}>
              Anterior
            </Button>
          )}
          <Button size="sm" onClick={ultimo ? encerrar : proximo}>
            {ultimo ? "Concluir" : "Próximo"}
          </Button>
        </div>
      </div>
    </>
  );

  // Passo sem âncora (boas-vindas / WhatsApp): cartão centralizado.
  if (!passo.alvo || !ancora) {
    return (
      <div
        className="fixed inset-0 z-[60] grid place-items-center bg-ink/55 p-4"
        role="dialog"
        aria-modal="true"
        aria-label={passo.titulo}
      >
        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">{corpo}</div>
      </div>
    );
  }

  return (
    <>
      {/* Bloqueia interação com a página; o escurecimento vem do holofote. */}
      <div className="fixed inset-0 z-[60]" aria-hidden />

      {rect && (
        <div
          className="tour-holofote"
          aria-hidden
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}

      <Popover.Root
        open
        onOpenChange={(aberto) => {
          if (!aberto) encerrar();
        }}
      >
        <Popover.Portal>
          <Popover.Positioner
            anchor={ancora}
            side={ladoDe(passo, ancora)}
            align="center"
            sideOffset={14}
            collisionPadding={16}
            className="z-[62]"
          >
            <Popover.Popup
              className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-white p-5 shadow-xl outline-none"
              aria-label={passo.titulo}
            >
              <Popover.Arrow className="text-white">
                <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden>
                  <path d="M0 8 L8 0 L16 8 Z" fill="currentColor" />
                </svg>
              </Popover.Arrow>
              {corpo}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}
