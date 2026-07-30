# ROADMAP — Zap Finanças

> Rastreador vivo de progresso. Fonte única de "feito / em aberto / adiado".
> Atualizar a cada entrega. Visão e escopo originais: [`specs/`](specs/).
> Última atualização: 2026-07-27.

Legenda: ✅ feito · 🔧 em andamento · 📋 planejado · 💤 adiado conscientemente

---

## Fases

### Fase 0 — Fundação ✅
Auth (signup/login/reset/OAuth), proxy de rotas, schema 12 tabelas + RLS, shell autenticado, trial 14 dias.

### Fase 1 — Open Finance ✅ (mock-first)
- ✅ Abstração de provider (`src/lib/openfinance/`) + factory por env (`OPENFINANCE_PROVIDER`)
- ✅ Mock determinístico (bancos/contas/transações/cartões/investimentos BR)
- ✅ Pipeline de sync idempotente (contas, transações, cartões, parcelas, investimentos)
- ✅ Categorização: regras determinísticas + fallback IA (Gemini/mock, `AI_PROVIDER`)
- ✅ Telas com dados reais: contas, transações, cartões, investimentos
- ✅ Webhook Pluggy (`/api/webhooks/pluggy`) + cron de sync (`/api/cron/sync`)
- ✅ **Pluggy real** implementado e testado contra o sandbox (auth, connectors, items,
  accounts, `/v2/transactions` com cursor, investments). Fix: investimentos gravam com
  `account_id` null (Pluggy os devolve no nível do item). Produção: falta o widget
  Pluggy Connect no frontend (hoje `createItem` usa credenciais de teste sandbox).
- ✅ **Gemini real** ligado (`gemini-flash-latest`) — validado ao vivo (fallback de
  categorização funcionando: sync Pluggy → 8 tx categorizadas pela IA).

### Fase 2 — Inteligência financeira ✅ (MUST) / 💤 (SHOULD)
MUST entregues:
- ✅ Motor de fatura projetada (`src/lib/fatura.ts`, testado) + fatura aberta em /cartoes
- ✅ Mapa de parcelas futuras (`src/lib/installments.ts`, testado)
- ✅ Dashboard consolidado (saldo, fatura, investimentos, gastos por categoria)
- ✅ Detecção de assinaturas e cobranças duplicadas (`src/lib/recurring.ts`, testado)
- ✅ Limite seguro do mês (`src/lib/safe-limit.ts`, testado)

SHOULD:
- ✅ Alertas in-app (`src/lib/alerts.ts`, testado): limite estourado/atenção, fatura prestes a fechar, cobrança duplicada — derivados do estado, exibidos no dashboard
- 💤 Previsão de fatura por IA
- 💤 Consolidação de dividendos/rendimentos para IR
- 💤 Simulador de quitação (bola de neve / avalanche)
- 💤 Orçamentos por categoria (`budgets`) + alerta de orçamento — falta a UI de definição de orçamento

### Fase 3 — Assistente WhatsApp ✅ (MUST, mock-first)
- ✅ Abstração `src/lib/whatsapp/` (provider interface + mock + stub Evolution + factory)
- ✅ Webhook inbound (`/api/webhooks/whatsapp`) — aceita formato Evolution e formato simples de teste
- ✅ Vínculo telefone↔usuário (`whatsapp_links` + código de pareamento; UI em `/configuracoes/whatsapp`)
- ✅ Interpretação de mensagens (`src/lib/whatsapp/intent.ts`, testado): saldo, fatura, gastos, registrar gasto
- ✅ Roteador (`handler.ts`) + categorização (regras + fallback IA, igual ao sync)
- ✅ Alertas outbound (`/api/cron/whatsapp-alerts`) com dedup 24h via tabela `alerts`
- ✅ Resumo financeiro compartilhado (`src/lib/finance-summary.ts`) — dashboard e alertas usam a mesma fonte
- ✅ **Evolution API LIVE em produção** (Railway, build **do fonte** — a imagem Docker pré-buildada
  falha na Railway com "Failed to create deployment"; buildar do repo `EvolutionAPI/evolution-api`
  resolve). Instância `zapfinancas` pareada; webhook Evolution → `/api/webhooks/whatsapp` (header
  `apikey`); env na Vercel (`WHATSAPP_PROVIDER=evolution` + `EVOLUTION_API_URL/KEY/INSTANCE`).
  **Pipeline validado E2E com dados reais**: pareamento → `saldo` → resposta com o valor real da conta.
- ✅ **WhatsApp multimodal (P0 da Fase 6)**: NLU por Gemini p/ frases livres (regex continua
  como caminho rápido; IA só no "desconhecido" — validada ao vivo, inclusive multi-gasto com
  gíria), **áudio** (Evolution `getBase64FromMediaMessage` → Gemini interpreta voz como gasto
  OU pergunta) e **foto de nota fiscal** (Gemini Vision extrai estabelecimento/total/itens →
  registra categorizado e detalha os itens). Mídia só é baixada APÓS vínculo confirmado.
- 📋 **Pendente p/ produção:** número dedicado pro bot (webhook e instância seguem desligados
  desde o incidente; religar só com número dedicado — ver docs/evolution-whatsapp.md)
- 💤 Respostas ricas (listas/botões)

### Fase 4 — Monetização (Mercado Pago) ✅ (MUST, mock-first)
- ✅ Abstração `src/lib/payments/` (provider mock + stub Mercado Pago + factory por `PAYMENTS_PROVIDER`)
- ✅ Planos (`plans.ts`, preço de fundador) + UI `/assinar` (paywall + planos + gestão)
- ✅ Checkout mock (`/checkout/mock`) → ativação (mesma função do webhook)
- ✅ Webhook (`/api/webhooks/mercadopago`) → ativar/cancelar/inadimplente
- ✅ Gating de acesso (`src/lib/payments/access.ts`, testado) no layout `(app)` → bloqueado redireciona p/ `/assinar`
- ✅ Dunning (`/api/cron/dunning`): ativo vencido → inadimplente → expirado (com carência)
- ✅ **Mercado Pago real ligado (sandbox) e validado em produção**: app "Assinaturas"
  criada, credenciais de teste na Vercel, preapproval cria (init_point), webhook
  registrado e **validação x-signature confirmada** (200 real / 401 forjada). Webhook
  retorna 401 p/ assinatura inválida (WebhookSignatureError). Falta só o **Modo de
  produção** do MP (credenciais de produção) quando for cobrar de verdade.
- 💤 Portal avançado (trocar de plano sem cancelar), cupons

### Fase 5 — Lançamento 🔧
- ✅ LGPD: consentimento ativo no signup (`lgpd_consent_at`) + página `/privacidade`
- ✅ LGPD: export de dados (`/api/conta/exportar`) + exclusão de conta (cascade)
- ✅ Security review (1ª rodada): corrigidos bypass do checkout mock em produção,
  confused-deputy no `data.id` do webhook MP, código de pareamento via CSPRNG,
  conteúdo financeiro fora de logs
- ✅ **Deploy na Vercel (produção LIVE)**: env vars (Supabase/Gemini/Pluggy/CRON_SECRET)
  configuradas via API, Deployment Protection desligado, crons ativos. Supabase Auth
  redirect URLs configuradas. Webhook Pluggy registrado + validado (token na URL, pois
  o Pluggy não usa HMAC). URL provisória `.vercel.app` até o domínio do Registro.br.
- ✅ **2ª security review** (pós-providers reais): sem vuln de código; achados operacionais
  (revogar token Vercel, remover user demo antes do launch, widget Pluggy Connect p/
  Open Finance real, religar protection com domínio custom, MP em modo teste)
- ✅ **Performance**: dashboard busca transações por janela de data (~5 meses) em vez de limit fixo
- ✅ **Landing atualizada**: reposicionada para PFM (Open Finance + IA + WhatsApp), FAQ corrigido
- ✅ Validação E2E em produção (signup → Pluggy real → dashboard → /assinar) — tudo funcionando
- 📋 Restante p/ launch público: widget Pluggy Connect (produção real), MP modo produção,
  domínio Registro.br, remover user demo

### Fase 6 — Paridade competitiva 🔧 (benchmark: Dinzo; análise 2026-07-27)
Concorrência direta (Open Finance + WhatsApp + web): só o Dinzo. POQT/Financinha não têm
Open Finance; Mobills/Organizze não têm WhatsApp. Ganhamos em: inteligência do WhatsApp,
qualidade (parcelas do Dinzo bugam nas reviews) e preço (R$12,49/mês anual vs R$20,82+).

- ✅ **P0 — WhatsApp multimodal**: NLU livre (Gemini) + áudio + foto de nota fiscal
- ✅ **P1a — Orçamentos por categoria** (`src/lib/budgets.ts` testado + `/orcamentos`):
  limite mensal com carry-over (vale até ser substituído; 0 desliga), barra de progresso,
  alertas `orcamento_atencao` (≥80%)/`orcamento_estouro` no dashboard E no cron de WhatsApp
  (mesma fonte: resumoFinanceiro)
- ✅ **P1b — Fechamento mensal** (`src/lib/monthly-close.ts` testado + `/fechamento` +
  cron `0 12 1 * *`): entradas/saídas, quanto sobrou (% da renda), top categorias com
  participação, maior gasto e variação vs. mês anterior. Chega sozinho no WhatsApp no dia 1º
  (dedup por mês via `alerts`) e responde ao comando *fechamento*; web tem navegação por mês.
  Fonte única (`carregarFechamento`) para WhatsApp e web.
- 📋 **P1 — Retenção (restante)**: contas manuais (CRUD, p/ dinheiro/VR fora do Open Finance)
- 📋 **P2 — Diferenciais**: score de saúde financeira · categorias personalizadas ·
  gamificação leve (streak) · PWA instalável
- 💤 **P3 — Expansão**: multi CPF/CNPJ (PJ, ângulo do Dinzo Ultra) · compartilhamento familiar

---

## Dívida técnica & qualidade (transversal — não deixar acumular)

- ✅ **Tipagem do Supabase**: `types.ts` gerado do schema real (`supabase gen types`) + generic `Database` plugado em todos os clients; upserts do sync validados contra os tipos `Insert`.
- ✅ **CI**: GitHub Actions (`.github/workflows/ci.yml`) roda `lint` + `test` + `build` a cada push/PR.
- ✅ **Segurança (hardening)**: webhook Pluggy e cron fazem *fail closed* em produção sem segredo; logs sem valores financeiros; `service_role` só em route handlers server-side. Revisão ampla de segurança fica para a Fase 5.
- 📋 **Testes de integração** dos route handlers (webhook/cron) e server actions em CI — hoje validados manualmente via script.
- 📋 **Observabilidade**: Sentry (citado na arquitetura, ainda não instalado).
- 📋 **Performance**: dashboard recomputa sobre ~800 transações a cada load; avaliar agregação no Postgres / cache quando o volume crescer.
- 📋 **Mobile**: navegação mobile-first feita; falta uma passada de QA visual em device real (375px) e estados de toque.

---

## Como manter este arquivo
Ao concluir um item, mover para ✅ e referenciar o commit/arquivo. Ao adiar algo
de propósito, marcar 💤 com uma linha de justificativa — nunca apagar silenciosamente.
