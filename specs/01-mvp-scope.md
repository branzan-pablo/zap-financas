# MVP-SCOPE — CartãoZap

> O MVP só será construído **após GO na Fase 2.5** (validação de demanda).
> Este documento congela o escopo decidido nas Fases 1–2.

## Wedge
**"Controle seu cartão pelo WhatsApp — saiba sua fatura antes dela fechar."**

## MUST (sem isto não há produto)
- Cadastro de cartões (limite, dia de fechamento, vencimento)
- Lançamento de compras à vista **e parceladas** (PWA)
- **WhatsApp escopado em cartão** (Evolution): registrar parcela por texto ("TV em 10x de 300") + consultar fatura/parcelas
- **Fatura projetada em tempo real** (atual + próximas)
- **Mapa de parcelas futuras** (comprometido por mês à frente)
- Notificações de retenção: pré-fechamento + parcela comprometida
- Auth + LGPD/RLS — **PWA é a fonte da verdade** (WhatsApp degrada, não derruba)

## SHOULD
- Import OFX/CSV da fatura
- "Limite seguro do mês"
- Visão consolidada multi-cartão
- Simulador de quitação (bola de neve / avalanche)

## COULD
- Áudio no WhatsApp
- Parser de PDF da fatura
- Recorrências/assinaturas
- Compartilhar com parceiro(a)

## FORA DO MVP (e por quê)
- **Open Finance / conexão automática** — custo por conexão mata o custo-zero.
- **Assistente genérico** (investimentos, IR, gastos não-cartão) — é o erro do produto inchado.
- **App nativo** — começa PWA.
- **WhatsApp Cloud API oficial** — migra só antes de escalar pagantes.

## Hipóteses a validar (no MVP, pós-landing)
- H1 Ativação ≥ 40% · H2 Retenção W4 ≥ 25% · H3 free→paid ≥ 3% · H4 canal orgânico → cadastro a CAC ≈ 0

## Arquitetura (resumo)
- Next.js + Supabase. UI leve no cliente; cálculo de fatura/parcelas/juros e validação **no servidor** (Edge/Postgres functions + RLS por usuário).
