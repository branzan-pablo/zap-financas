# DESIGN-GUIDELINES — Zap Finanças

Direção: clean, moderno, light (refs: Linear, Resend, Vercel) — mas com identidade própria. Eixo emocional: **tensão (susto) → controle (clareza)**.

## Paleta
| Token | Hex | Uso |
|---|---|---|
| ink | `#0B1220` | texto principal, fundo de elementos-assinatura |
| paper | `#FBFBF9` | fundo da página (branco-quente) |
| emerald | `#0FA968` | accent primário (controle/positivo; evoca zap sem clonar) |
| emerald-soft | `#E7F5EE` | fundos sutis de destaque positivo |
| amber | `#F59E0B` | alerta / o "susto" das parcelas |
| amber-soft | `#FDF3E2` | fundo de aviso |
| slate | `#5B6675` | texto secundário |
| line | `#E8E8E3` | bordas/hairlines |

## Tipografia
- **Display:** Space Grotesk (headlines) — técnico, fintech.
- **Corpo/UI:** Inter.
- **Numérico/Mono:** JetBrains Mono — para todo valor R$, fatura, parcelas (sensação de extrato/ledger). Escolha derivada do assunto.

## Escala e detalhes
- Espaçamento base 8px (4px para ajustes finos).
- Border radius: 12px (cards), 10px (botões/inputs), 999px (pills).
- Sombra: única e suave — `0 1px 2px rgba(11,18,32,.06), 0 8px 24px rgba(11,18,32,.06)`. Sem excesso.

## Elemento-assinatura
Card "fatura projetada": número grande em mono + delta vs. mês anterior + **linha do tempo de parcelas futuras** (barras horizontais por mês, animadas na entrada) + uma bolha de chat WhatsApp ("comprei TV em 10x de 300" → "registrado ✓"). É a tradução visual do wedge; gastar a ousadia aqui e manter o resto quieto.

## shadcn/ui
Base do design system. Usar: Button (CTA), Input (email), Card (features/pricing), Badge/pill (eyebrows). Tokens shadcn (`--primary` etc.) mapeados para a paleta acima.

## Acessibilidade
Contraste AA · foco visível · `prefers-reduced-motion` desliga as animações de entrada.
