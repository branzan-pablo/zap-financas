import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { TONE, type Tone } from "./tone";

/**
 * Superfície da marca.
 *
 * `rounded-2xl border border-line bg-white` estava escrito à mão em 65 lugares —
 * este componente é essa string, com nome. Nada de `ring`, `shadow` ou variante
 * escura do shadcn genérico: a superfície do produto é papel branco sobre papel
 * de extrato, separado por uma linha fina.
 */
const cardVariants = cva("rounded-2xl border", {
  variants: {
    // `none` para listas: a lista encosta na borda e cada item tem o seu padding.
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
      hero: "p-5 sm:p-6",
    },
    /** Convite a preencher algo que ainda não existe (empty states). */
    dashed: {
      true: "border-dashed",
      false: "",
    },
    /**
     * Cartão que flutua sobre o papel — usado nas telas de auth, onde o cartão
     * é a tela inteira e precisa se descolar do fundo.
     */
    elevated: {
      true: "shadow-[0_1px_2px_rgba(11,18,32,.06),0_8px_24px_rgba(11,18,32,.06)]",
      false: "",
    },
  },
  defaultVariants: { padding: "md", dashed: false, elevated: false },
});

type CardProps = useRender.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    /** Colore a superfície pelo status. Ausente = papel branco neutro. */
    tone?: Tone;
  };

/**
 * `render` (idioma do `@base-ui/react`, como no `Badge`) troca a tag mantendo o
 * estilo — é assim que um cartão vira `<details>` sem duplicar a superfície.
 */
function Card({
  className,
  padding,
  dashed,
  elevated,
  tone,
  render,
  ...props
}: CardProps) {
  const t = tone ? TONE[tone] : TONE.neutro;
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          cardVariants({ padding, dashed, elevated }),
          t.fundo,
          t.borda,
          className
        ),
      },
      props
    ),
    render,
    state: { slot: "card" },
  });
}

/** Título de bloco dentro de um cartão — o `h2` das telas internas. */
function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="card-title"
      className={cn("font-display text-lg font-bold text-ink", className)}
      {...props}
    />
  );
}

export { Card, CardTitle, cardVariants };
