# BRIEF — CartãoZap *(nome de trabalho, provisório)*

> Documento vivo. Gerado via framework de validação em fases (ver `specs/02-demand-validation.md`).
> Status atual: **Fase 2.5 — Validação de Demanda** (build = landing/smoke test, não o app).

## Problema (1 frase)
Quem usa muito o cartão de crédito perde a noção da fatura real e do quanto já comprometeu em parcelas futuras — e toma susto quando a fatura fecha.

## Solução proposta
App **focado em cartão**, controlado pelo **WhatsApp**: o usuário registra compras (inclusive parceladas) por mensagem e consulta a **fatura projetada** e o **mapa de parcelas futuras** antes do fechamento. PWA como fonte da verdade; WhatsApp como camada de captura/consulta.

## Público-alvo
Usuário intenso de cartão (não o endividado pesado), 25–40 anos, mobile-first, que vive no limite e teme perder o controle. *Não* é o público mass-market generalista do Dinzo/Mobills.

## Diferencial competitivo
Os concorrentes tratam cartão como item secundário de um PFM inchado. Aqui o cartão é **o produto inteiro**, e a captura por WhatsApp escopada em cartão reduz o atrito de lançamento — o maior motivo de abandono de apps de finanças.

## Modelo de negócio
SaaS lifestyle. Grátis: 1 cartão + fatura projetada + mapa de parcelas (marketing/aquisição). Pago (~R$14,90/mês ou R$119/ano): cartões ilimitados, simulador de quitação, alertas, import. Pagamento PIX + cartão.

## Canal de aquisição
Orgânico: conteúdo curto (Reels/TikTok/Shorts) no tema "o susto das parcelas / juros invisíveis" + SEO. Teste pago pontual (~R$150) para acelerar a validação de demanda.

## Métricas de sucesso (do negócio)
- Ativação ≥ 40% (cadastro → registra 1 cartão com parcela)
- Retenção W4 ≥ 25%
- Conversão free→paid ≥ 3%
- Meta financeira: R$5–30k/mês recorrente (~1.000–1.500 pagantes)

## Restrições conscientes
- **Sem Open Finance no MVP** (agregadores custam ≥ R$540/mês; fora do orçamento). Entrada via manual + OFX.
- **WhatsApp via Evolution API só na fase de teste**; migrar para Cloud API oficial antes de escalar pagantes.
- LGPD desde o dia 1; cálculo financeiro no servidor (RLS).
