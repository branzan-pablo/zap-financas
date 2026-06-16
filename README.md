# CartãoZap

> Controle seu cartão de crédito pelo WhatsApp — saiba sua fatura antes dela fechar.

**Status:** Fase 2.5 — Validação de Demanda. Este repositório contém a **landing page de smoke test**, não o app. O MVP só é construído após o GO de demanda (ver `specs/`).

## Stack
- Next.js 16 (App Router) + React 19
- Tailwind v4 + shadcn/ui
- Supabase (captura de leads)

## Rodar localmente
```bash
npm install
npm run dev
```
Sem variáveis de ambiente, os leads são salvos em `.data/waitlist.json` (só em dev).

## Produção (captura real de leads)
1. Crie um projeto grátis no [Supabase](https://supabase.com).
2. Rode `supabase/schema.sql` no SQL editor.
3. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy na Vercel (defina as mesmas variáveis no projeto).

## Specs (Spec-Driven Development)
- `specs/00-brief.md` — resumo executivo
- `specs/01-mvp-scope.md` — escopo do MVP (pós-validação)
- `specs/02-demand-validation.md` — contrato de métricas do smoke test
- `specs/03-landing-spec.md` — estrutura da landing
- `specs/04-design-guidelines.md` — design system

## Métricas do smoke test
A landing captura `email`, intenção de pagar (`wants_founder` via fake-door), `price_shown` e `source`. As metas de GO/NO-GO estão em `specs/02-demand-validation.md`.
