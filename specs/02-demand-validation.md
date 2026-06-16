# DEMAND VALIDATION — Fase 2.5 (smoke test)

> Gate decisivo. **As metas abaixo foram travadas ANTES de rodar e não podem ser ajustadas depois para "passar".**

## Pergunta a responder
Alguém quer isto a ponto de deixar o email — ou sinalizar que pagaria — antes do produto existir?

## Instrumento
Landing page (este repositório) com:
- Proposta de valor + como funciona (3 passos)
- **CTA principal:** entrar na lista de espera (email)
- **Fake-door de preço:** botão "Quero o Plano Fundador — R$ X" → captura email marcando intenção de pagar (`wants_founder = true`)

## Tráfego
- Orgânico: 5–10 Reels/Shorts em 2–3 semanas (tema: susto das parcelas / juros invisíveis)
- Pago: ~R$150 em Meta/TikTok Ads → landing

## Metas de aprovação (contrato — fixas)
| Métrica | Meta GO |
|---|---|
| Conversão visita→email | ≥ 15% (blended) |
| Volume de leads | ≥ 150 emails em 3–4 semanas |
| Fake-door "Plano Fundador" (clica/converte) | ≥ 30% dos leads |
| Sinal de canal orgânico | ≥ 1 vídeo com tração real (>10k views) |
| Custo por lead (teste pago) | ≤ R$3 |

## Decisão (definida antes)
- **Bate as metas →** GO para Fase 3 (PRD completo + build do MVP).
- **Email ok, fake-door < 30% →** REVISAR preço/proposta, re-testar. Não construir.
- **Conversão/volume fracos →** NO-GO / pivot de wedge ou público antes de qualquer código.

## Instrumentação
- Tabela `waitlist`: `email`, `created_at`, `wants_founder`, `price_shown`, `source` (utm), `user_agent`.
- Analytics de visita: a definir (Plausible/Umami free ou Vercel Analytics) para medir o denominador (visitas).
