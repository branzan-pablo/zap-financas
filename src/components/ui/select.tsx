import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * `<select>` nativo com a roupa do `.field`.
 *
 * Nativo de propósito: no celular ele abre a roda do sistema, que é melhor do
 * que qualquer dropdown que a gente escreveria — e funciona com teclado e leitor
 * de tela sem custo. `background-color` e `color` explícitos (via `.field`)
 * porque o Windows em tema escuro pinta select nativo de preto por conta própria.
 */
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn("field disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    />
  )
}

export { Select }
