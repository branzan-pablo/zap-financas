import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Campo de texto.
 *
 * Existiam dois sistemas concorrentes: este componente (shadcn genérico, com
 * `h-8` de desktop e zero usos) e a classe `.field` do globals.css (25 usos).
 * Ganhou o `.field`, porque é ele que carrega as decisões do produto — 44px de
 * alvo no toque, 16px de fonte para o iOS não dar zoom ao focar. O componente
 * agora só aplica essa classe e cuida do estado inválido.
 */
function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "field placeholder:text-slate/70 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger",
        className
      )}
      {...props}
    />
  )
}

export { Input }
