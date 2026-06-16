# LANDING-PAGE-SPEC — smoke test (estrutura)

Estrutura, não copy final. Objetivo único da página: **conversão visita → email** (com sinal de disposição a pagar via fake-door).

## Seções (em ordem)
1. **Nav** — logo + 1 CTA secundário ("Entrar na lista").
2. **Hero** — proposta de valor + CTA primário (form de email) + **elemento-assinatura** (card de fatura projetada + linha do tempo de parcelas + bolha de chat WhatsApp). Objetivo: comunicar o wedge em 5 segundos.
3. **Problema** — nomear a dor (susto da fatura, parcelas escondidas que comprometem meses futuros). Layout: 3 "sustos" curtos.
4. **Como funciona** — 3 passos: (1) manda no zap, (2) vê fatura projetada, (3) é avisado antes de fechar. Sequência real → usar numeração 01/02/03.
5. **Features** — 3 cards: Fatura projetada · Mapa de parcelas · Alerta pré-fechamento.
6. **Fake-door de preço** — card "Plano Fundador" com preço-alvo e CTA. Mede intenção de pagar.
7. **CTA final** — repetição do form de email + reforço de escassez ("vagas de fundador limitadas").
8. **Footer** — minimal, nota LGPD, sem links de produto inexistente.

## Hierarquia de CTAs
- Primário: capturar email (hero + CTA final).
- Secundário/sinal: "Quero o Plano Fundador" (fake-door → mesmo form, `wants_founder=true`).

## Quality floor
Responsivo até mobile · foco de teclado visível · `prefers-reduced-motion` respeitado · sem copy que prometa o que não existe.
