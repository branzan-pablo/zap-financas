# Zap Finanças

> Assistente financeiro completo no WhatsApp — Open Finance, IA e controle real do seu dinheiro.

**Status:** produto completo e **no ar em produção** (Vercel). Fases 0–4 entregues, Fase 5
(lançamento) e Fase 6 (paridade competitiva) quase fechadas. O que falta para o **launch
público** é externo — domínio, credenciais de produção e número dedicado do WhatsApp
(ver [`docs/launch-runbook.md`](docs/launch-runbook.md)).

Rastreador vivo de progresso: [`ROADMAP.md`](ROADMAP.md) — fonte única de feito / em aberto / adiado.

---

## O que é

Zap Finanças é um gestor financeiro pessoal (PFM) que conecta suas contas bancárias via Open Finance (Pluggy), categoriza transações automaticamente com IA e responde perguntas sobre suas finanças no WhatsApp (Evolution API) — sem baixar nada.

No WhatsApp o assistente entende **texto livre**, **áudio** e **foto de nota fiscal**: manda um
áudio dizendo "gastei cinquenta no mercado" e o lançamento entra categorizado; manda a foto de um
cupom e ele extrai estabelecimento, total e itens.

Benchmark direto: [Dinzo](https://dinzo.com.br/) — mesmo trio (Open Finance + WhatsApp + web),
com mais inteligência no WhatsApp e preço menor.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16.3 (App Router, Turbopack) · React 19.2 · Tailwind v4 · Base UI · anime.js |
| Auth + DB | Supabase (Postgres, Auth, RLS) · `@supabase/ssr` · tipos gerados do schema |
| Open Finance | Pluggy (+ widget Pluggy Connect) |
| IA | Google Gemini (`gemini-flash-latest`) — categorização, NLU do WhatsApp, áudio e Vision de nota fiscal |
| WhatsApp | Evolution API v2 self-hosted (Railway, build **do fonte**) |
| Pagamentos | Mercado Pago Assinaturas |
| Testes / CI | Vitest (151 testes) · GitHub Actions (`lint` + `test` + `build`) |
| Deploy | Vercel (4 crons) |

> ⚠️ **Next.js 16 breaking changes:** `params`/`searchParams` são `Promise<>`, `cookies()` é async,
> `middleware.ts` → [`src/proxy.ts`](src/proxy.ts). Leia [`specs/05-architecture.md`](specs/05-architecture.md)
> e os guias em `node_modules/next/dist/docs/` antes de codar.

### Arquitetura mock-first

Todo integrador externo fica atrás de uma abstração com **provider mock + provider real +
factory por env** — Open Finance, IA, WhatsApp e pagamentos. Isso permite rodar o produto
inteiro localmente sem uma única chave de API, e trocar de provider sem tocar em código:

```
src/lib/openfinance/   OPENFINANCE_PROVIDER = mock | pluggy
src/lib/ai/            AI_PROVIDER          = mock | gemini
src/lib/whatsapp/      WHATSAPP_PROVIDER    = mock | evolution
src/lib/payments/      PAYMENTS_PROVIDER    = mock | mercadopago
```

Em **produção os mocks são proibidos**: sem a env var correta o app lança erro em vez de cair no
mock. Um mock silencioso em produção injetaria transações fictícias no extrato real, engoliria
alertas do WhatsApp e — no caso do `/checkout/mock` — daria assinatura paga de graça.

---

## Fases de build

| Fase | Status | Entregável |
|---|---|---|
| **0 — Fundação** | ✅ | Auth, schema + RLS, shell autenticado, trial 14 dias |
| **1 — Open Finance** | ✅ | Pluggy real (validado no sandbox), sync idempotente, categorização por regras + IA |
| **2 — Inteligência** | ✅ (MUST) | Fatura projetada, mapa de parcelas, assinaturas/duplicatas, limite seguro, alertas |
| **3 — WhatsApp** | ✅ (MUST) | Evolution live, pareamento, NLU por IA, áudio, nota fiscal, alertas outbound |
| **4 — Monetização** | ✅ (MUST) | Mercado Pago (sandbox validado em produção), gating, dunning |
| **5 — Lançamento** | 🔧 | LGPD, 2 rodadas de security review, deploy live — falta só o que é externo |
| **6 — Paridade** | 🔧 | Orçamentos, fechamento mensal, contas manuais, score de saúde, categorias próprias, streak, PWA |

Detalhe item a item (inclusive o que foi **adiado de propósito**) em [`ROADMAP.md`](ROADMAP.md).

---

## Rodar localmente

Nenhuma chave de API é necessária — os providers mock cobrem Open Finance, IA, WhatsApp e pagamentos.

```bash
pnpm install
cp .env.example .env.local
# preencher só: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
pnpm dev
```

Acesse `http://localhost:3000/signup` → confirme o email → `/dashboard` com trial de 14 dias.
Em `/contas → Conectar conta` o provider mock gera bancos, contas, cartões e transações BR
determinísticos.

### Scripts

```bash
pnpm dev          # Next dev (Turbopack)
pnpm build        # build de produção
pnpm lint         # ESLint
pnpm test         # Vitest (run único)
pnpm test:watch   # Vitest em watch
```

### Aplicar schema no Supabase

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
```

---

## Variáveis de ambiente

[`.env.example`](.env.example) documenta cada variável, onde achar o valor e o que acontece se
faltar. Mínimo para rodar:

```
NEXT_PUBLIC_SUPABASE_URL=       # dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # anon public key
SUPABASE_SERVICE_ROLE_KEY=      # service_role (nunca NEXT_PUBLIC_)
```

Para exercitar integrações reais em dev, troque o provider correspondente e preencha as chaves
daquele bloco (`PLUGGY_*`, `GEMINI_API_KEY`, `EVOLUTION_*`, `MERCADOPAGO_*`).

---

## Estrutura de rotas

```
/                             landing
/login · /signup              mesma tela de abas (a rota escolhe a aba inicial)
/forgot-password              recuperação de senha
/privacidade                  política de privacidade (LGPD)

/dashboard                    visão geral: saldo, fatura, score, alertas, streak
/contas                       contas conectadas (Pluggy) e manuais
/transacoes                   extrato + categorias + lançamento manual
/cartoes                      cartões, fatura projetada e parcelas
/orcamentos                   orçamento mensal por categoria
/fechamento                   fechamento mensal, com navegação por mês
/investimentos                carteira de investimentos
/metas                        🚧 placeholder — não entregue (adiado)
/configuracoes                perfil, assinatura, exportar/excluir conta
/configuracoes/whatsapp       pareamento do número
/configuracoes/categorias     categorias personalizadas + palavras-chave

/assinar                      planos e paywall
/checkout/mock                checkout simulado (bloqueado em produção)

/api/webhooks/{pluggy,whatsapp,mercadopago}
/api/cron/{sync,dunning,whatsapp-alerts,monthly-close}
/api/conta/exportar           export de dados (LGPD)
```

Crons agendados em [`vercel.json`](vercel.json): sync 6h · dunning 8h · alertas WhatsApp 9h ·
fechamento mensal no dia 1º às 12h.

---

## Documentação

**Specs** (visão e escopo original):

- [`specs/00-brief.md`](specs/00-brief.md) — resumo executivo e posicionamento
- [`specs/01-mvp-scope.md`](specs/01-mvp-scope.md) — escopo por fase (MUST/SHOULD/WONT)
- [`specs/04-design-guidelines.md`](specs/04-design-guidelines.md) — paleta, tipografia, design system
- [`specs/05-architecture.md`](specs/05-architecture.md) — arquitetura, stack, breaking changes do Next.js 16

**Docs operacionais** (como as coisas realmente estão no ar):

- [`docs/launch-runbook.md`](docs/launch-runbook.md) — passo a passo do lançamento, na ordem certa
- [`docs/evolution-whatsapp.md`](docs/evolution-whatsapp.md) — deploy da Evolution, operação e o incidente de 2026-07-06
- [`docs/deploy-vercel.md`](docs/deploy-vercel.md) — env vars, crons, deployment protection
- [`docs/mercadopago-integration.md`](docs/mercadopago-integration.md) — assinaturas e validação de webhook
- [`docs/pre-producao-checklist.md`](docs/pre-producao-checklist.md) — o que verificar antes de cobrar de verdade

---

## Segurança

- RLS habilitado em todas as tabelas — dados isolados por `user_id = auth.uid()`
- Colunas de billing (`plano`, `trial_ends_at`) com `GRANT` restrito: o usuário
  não escreve nelas nem indo direto na API REST do Supabase — só o `service_role`,
  via webhook de pagamento e cron de dunning
- `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `MERCADOPAGO_ACCESS_TOKEN` — **nunca** `NEXT_PUBLIC_`
- Todo cálculo financeiro roda no servidor (Server Components / Route Handlers)
- Webhooks validados por assinatura (HMAC-SHA256, comparação em tempo constante)
  e idempotentes — reentrega não duplica lançamento
- Saldo ajustado por UPDATE atômico no Postgres (`ajustar_saldo`), não read-modify-write
- Headers de segurança em todas as rotas: HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` — em
  [`next.config.ts`](next.config.ts)
- CSP com **nonce por requisição** em [`src/proxy.ts`](src/proxy.ts) (não no config, porque
  `headers()` é estático e nonce que se repete não é nonce); sem `unsafe-inline` em `script-src`
- Providers externos **fail closed** em produção: sem a env var correta o app
  lança erro em vez de cair no mock
- Senha: mínimo 12 caracteres com letras e números, validado no servidor
- Chamadas a APIs externas com timeout (15s; 30s para IA)
- No WhatsApp, mídia só é baixada **depois** do vínculo confirmado; mensagem de número
  não vinculado ou de grupo recebe silêncio
- Duas rodadas de security review concluídas (ver Fase 5 no [`ROADMAP.md`](ROADMAP.md))
