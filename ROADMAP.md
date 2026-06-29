# ROADMAP — Zap Finanças

> Rastreador vivo de progresso. Fonte única de "feito / em aberto / adiado".
> Atualizar a cada entrega. Visão e escopo originais: [`specs/`](specs/).
> Última atualização: 2026-06-29.

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
- 📋 **Pendente p/ produção:** implementar `PluggyOpenFinanceProvider` real (hoje é stub) quando houver contrato/sandbox Pluggy
- 📋 **Pendente p/ produção:** ligar Gemini real (basta `GEMINI_API_KEY`); validar custo/qualidade

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

### Fase 3 — Assistente WhatsApp (Evolution API) 📋
- 📋 Abstração `src/lib/whatsapp/provider.ts` (mock-first, como em Open Finance)
- 📋 Self-host Evolution API (Docker) + webhook inbound (`/api/webhooks/whatsapp`)
- 📋 Vínculo telefone↔usuário (`whatsapp_links` + código de pareamento)
- 📋 Parsing de mensagens (Claude/Gemini): registrar transação, consultar saldo/fatura
- 📋 Alertas outbound (orçamento, pré-fechamento, parcelas)
- 💤 Parsing de áudio · respostas ricas

### Fase 4 — Monetização (Mercado Pago) 📋
- 📋 Planos + checkout (Pix + cartão recorrente)
- 📋 Webhook de pagamento → estado de assinatura → gating de features
- 📋 Dunning / retry · portal de gerenciamento

### Fase 5 — Lançamento 📋
- 📋 LGPD: consentimento, export/delete de dados
- 📋 Security review · performance · polish · landing atualizada

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
