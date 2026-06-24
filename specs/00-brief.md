# BRIEF — Zap Finanças

> Documento vivo. Atualizado em 24/06/2026 — pivô de wedge estreito (cartão) para PFM amplo.
> Status atual: **Fase 3 — Build do produto** (validação de demanda concluída, GO confirmado).

## Problema (1 frase)

Brasileiros perdem o controle financeiro por falta de visibilidade — não sabem onde gasta, quanto deve, quando fecha a fatura ou quanto rende o investimento — e ficam dependentes de planilhas que ninguém mantém.

## Solução proposta

Assistente financeiro completo acessível pelo **WhatsApp**: conecta contas via **Open Finance** (100+ bancos), categoriza transações automaticamente com IA, projeta fatura, consolida investimentos, alerta antes de estourar e responde perguntas financeiras em linguagem natural — tudo no app que o usuário já usa todo dia.

## Público-alvo

Usuário brasileiro 25–40 anos, mobile-first, renda média-alta, que usa cartão de crédito com frequência e tem algum investimento. Cansado de planilha, não quer abrir cinco apps de banco, quer respostas em segundos pelo WhatsApp.

## Diferencial competitivo

- **WhatsApp como interface principal** — não só notificação, mas consulta e ação real em linguagem natural (texto + áudio).
- **Open Finance desde o início** — zero entrada manual, dados reais de 100+ bancos.
- **IA aplicada a finanças reais** — categorização automática, previsão de fatura, detecção de assinaturas e cobranças duplicadas, consolidação de dividendos para IR.
- **Foco BR** — Pix, cartão com parcelamento, impostos BR, língua PT-BR nativa.

## Modelo de negócio

SaaS com trial generoso. **Trial:** 14 dias com tudo liberado. **Pago:** R$19,90/mês · R$49,90/trimestre · R$149,90/ano (preço de fundador travado para os primeiros usuários). Pagamento Pix + cartão recorrente (Mercado Pago).

## Canal de aquisição

- Orgânico: conteúdo curto (Reels/TikTok/Shorts) — tema: parcelas escondidas, susto de fatura, dinheiro sumindo.
- SEO: termos de controle financeiro, assistente financeiro WhatsApp, Open Finance.
- Leads capturados na landing (waitlist existente) — base para convite de lançamento.

## Métricas de sucesso

- Ativação ≥ 40% (signup → conecta 1 conta Open Finance)
- Retenção W4 ≥ 25%
- Conversão trial→pago ≥ 15%
- Meta financeira: R$5–30k/mês recorrente (~500–1.500 pagantes)

## Stack e restrições

- **Open Finance:** Pluggy (sandbox disponível; custo por conexão ativa — confirmar contrato).
- **WhatsApp:** Evolution API (self-hosted Docker) para início; migrar para Cloud API oficial antes de escalar a 1.000+ usuários ativos.
- **IA/LLM:** Claude (Anthropic) — Haiku 4.5 para categorização/parsing em massa; Sonnet 4.6 para Q&A financeiro complexo.
- **Pagamentos:** Mercado Pago Assinaturas (Pix + cartão recorrente).
- **LGPD desde o dia 1** — consentimento, RLS por usuário, export/delete de dados.
