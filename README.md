# Zap Finanças

> Assistente financeiro completo no WhatsApp — Open Finance, IA e controle real do seu dinheiro.

**Status:** Fase 0 concluída (auth + schema + shell). Fase 1 em andamento (Open Finance / Pluggy).

---

## O que é

Zap Finanças é um gestor financeiro pessoal (PFM) que conecta suas contas bancárias via Open Finance (Pluggy), categoriza transações automaticamente com IA (Claude) e responde perguntas sobre suas finanças no WhatsApp (Evolution API) — sem baixar nada.

Inspirado no [Dinzo](https://dinzo.com.br/), mas com WhatsApp como canal primário e Open Finance nativo desde o início.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · shadcn/ui |
| Auth + DB | Supabase (Postgres, Auth, RLS) · @supabase/ssr |
| Open Finance | Pluggy |
| IA | Claude (Haiku 4.5 para categorização · Sonnet 4.6 para Q&A) |
| WhatsApp | Evolution API (self-hosted Docker) |
| Pagamentos | Mercado Pago Assinaturas |
| Deploy | Vercel |

> ⚠️ **Next.js 16 breaking changes:** `params`/`searchParams` são `Promise<>`, `cookies()` é async, `middleware.ts` → `proxy.ts`. Leia `specs/05-architecture.md` antes de codar.

---

## Fases de build

| Fase | Status | Entregável |
|---|---|---|
| **0 — Fundação** | ✅ Completa | Auth, schema 12 tabelas + RLS, shell autenticado, trial 14 dias |
| **1 — Open Finance** | 🔧 Em andamento | Pluggy Connect, sync de contas/transações, categorização IA |
| **2 — Inteligência** | 📋 Planejada | Motor de fatura projetada, mapa de parcelas, insights, Q&A |
| **3 — WhatsApp** | 📋 Planejada | Evolution API, parsing de mensagens/áudio, alertas |
| **4 — Monetização** | 📋 Planejada | Mercado Pago Assinaturas, gating de features, dunning |
| **5 — Lançamento** | 📋 Planejada | LGPD, security review, polish, landing atualizada |

---

## Rodar localmente

```bash
pnpm install
cp .env.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
pnpm dev
```

### Aplicar schema no Supabase

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
```

Acesse `http://localhost:3000/signup` → confirme email → `/dashboard` com banner de trial de 14 dias.

---

## Variáveis de ambiente

Ver `.env.example` para a lista completa. Mínimo para rodar:

```
NEXT_PUBLIC_SUPABASE_URL=       # dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # anon public key
SUPABASE_SERVICE_ROLE_KEY=      # service_role (nunca NEXT_PUBLIC_)
```

---

## Estrutura de rotas

```
/                     landing (pré-venda)
/signup               cadastro (trial 14 dias)
/login                login
/dashboard            visão geral + banner trial
/contas               contas bancárias (Fase 1)
/transacoes           extrato + categorias (Fase 1)
/cartoes              cartões + fatura projetada (Fase 2)
/metas                metas financeiras (Fase 2)
/investimentos        carteira de investimentos (Fase 1)
/configuracoes        perfil, assinatura, LGPD
```

---

## Specs

- `specs/00-brief.md` — resumo executivo e posicionamento
- `specs/01-mvp-scope.md` — escopo por fase (MUST/SHOULD/WONT)
- `specs/04-design-guidelines.md` — paleta, tipografia, design system
- `specs/05-architecture.md` — decisões de arquitetura, stack, breaking changes Next.js 16

---

## Segurança

- RLS habilitado em todas as 12 tabelas — dados isolados por `user_id = auth.uid()`
- `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `MERCADOPAGO_ACCESS_TOKEN` — **nunca** `NEXT_PUBLIC_`
- Todo cálculo financeiro roda no servidor (Server Components / Route Handlers)
- Webhooks validados por assinatura (HMAC)
