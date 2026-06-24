# ARCHITECTURE — Zap Finanças

> Decisões de arquitetura travadas em 24/06/2026.

## Stack

| Camada | Tecnologia | Notas |
|---|---|---|
| Frontend / PWA | Next.js 16 (App Router) + React 19 | ⚠️ Ler `node_modules/next/dist/docs/` antes de qualquer código — APIs têm breaking changes vs. versões anteriores. |
| UI | Tailwind v4 + shadcn/ui + @base-ui/react | Tokens de design em `specs/04-design-guidelines.md`. |
| Auth + DB + RLS | Supabase (Postgres, Auth, Edge Functions) | RLS por usuário em todas as tabelas financeiras. Usar `@supabase/ssr` para Next.js (não `supabase-js` diretamente no servidor). |
| Open Finance | Pluggy (`pluggy.ai`) | Sandbox disponível. Custo por conexão ativa — confirmar contrato antes da Fase 1. Alt: Belvo. |
| IA / LLM | Claude (Anthropic) | Haiku 4.5 p/ categorização e parsing em massa (baixo custo); Sonnet 4.6 p/ Q&A financeiro complexo. Consultar skill `claude-api` antes de integrar. |
| WhatsApp | Evolution API (self-host Docker) | Webhook inbound/outbound. Abstrair atrás de `src/lib/whatsapp/` p/ trocar por Cloud API depois. |
| Pagamentos | Mercado Pago Assinaturas | Pix + cartão recorrente. Webhooks de status, dunning, retry. |
| Observabilidade | Sentry + Vercel Analytics | Erros + funil. Vercel Analytics já instalado no repo. |

## Next.js 16 — breaking changes críticos

1. **`params` e `searchParams` são `Promise<>`** — sempre `await params` em pages, layouts e route handlers.
2. **`cookies()`, `headers()`, `connection()`** — são async; sempre `const cookieStore = await cookies()`.
3. **Route handlers**: GET não é cacheado por default; use `export const dynamic = 'force-static'` para optar.
4. **Server Functions** (antigos "Server Actions") — usar `'use server'` no topo da função ou do arquivo.
5. **Turbopack por default** em `next dev` e `next build`.
6. **Node.js 20.9+** obrigatório.

## Estrutura de rotas (App Router)

```
src/app/
  layout.tsx              ← root layout (fonts, Analytics, providers)
  page.tsx                ← landing page (smoke test — manter enquanto não tiver rebrand completo)
  obrigado/page.tsx       ← pós-cadastro waitlist
  api/
    waitlist/route.ts     ← captura leads (existente)
    webhooks/
      pluggy/route.ts     ← Fase 1: eventos Open Finance
      mercadopago/route.ts ← Fase 4: eventos de pagamento
      whatsapp/route.ts   ← Fase 3: inbound Evolution API
  (auth)/                 ← grupo sem layout autenticado
    login/page.tsx
    signup/page.tsx
    callback/route.ts     ← OAuth callback Supabase
    forgot-password/page.tsx
    reset-password/page.tsx
  (app)/                  ← grupo com layout autenticado (middleware protegido)
    layout.tsx            ← sidebar/nav + subscription gate
    dashboard/page.tsx
    contas/page.tsx
    transacoes/page.tsx
    cartoes/page.tsx
    metas/page.tsx
    investimentos/page.tsx
    configuracoes/page.tsx
```

## Schema Supabase (visão geral)

```sql
-- Auth gerenciado pelo Supabase Auth (auth.users)

profiles          -- id (→ auth.users), nome, telefone, plano, trial_ends_at
accounts          -- id, user_id (RLS), nome, banco, tipo, saldo, pluggy_item_id
transactions      -- id, user_id (RLS), account_id, valor, descricao, categoria_id, data, pluggy_tx_id
categories        -- id, user_id (RLS + globais), nome, icone, cor, regras_matching
cards             -- id, user_id (RLS), nome, limite, dia_fechamento, dia_vencimento, account_id
installments      -- id, user_id (RLS), tx_id, total_parcelas, parcela_atual, valor_parcela
budgets           -- id, user_id (RLS), categoria_id, limite_mes, mes_referencia
goals             -- id, user_id (RLS), nome, valor_alvo, valor_atual, data_alvo
investments       -- id, user_id (RLS), account_id, tipo, nome, valor_atual, rendimento
subscriptions     -- id, user_id (RLS), plano, status, mp_subscription_id, trial_ends_at
alerts            -- id, user_id (RLS), tipo, canal, agendado_para, enviado_em
whatsapp_links    -- id, user_id (RLS), telefone, status, paired_at
```

**RLS:** todas as tabelas com `user_id` têm política `user_id = auth.uid()`. Cálculos financeiros rodam em Edge Functions com `service_role` quando necessário (ex: agregação cross-account).

## Princípios

- **Servidor para tudo financeiro**: cálculos de fatura, saldo, parcelas, juros → sempre server-side. Nunca confiar no cliente para valores monetários.
- **Secrets server-only**: nunca `NEXT_PUBLIC_` para Pluggy, Claude, Mercado Pago, Evolution. Seguir padrão de `src/lib/waitlist.ts`.
- **Abstrações de provider**: WhatsApp atrás de `src/lib/whatsapp/provider.ts`; Open Finance atrás de `src/lib/openfinance/`; IA atrás de `src/lib/ai/`. Facilita troca de fornecedor.
- **LGPD**: consentimento no onboarding; export/delete de dados; dados financeiros nunca em logs.
