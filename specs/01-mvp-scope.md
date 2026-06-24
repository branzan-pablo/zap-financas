# MVP-SCOPE — Zap Finanças

> Pivô confirmado em 24/06/2026. Escopo expandido de wedge de cartão para PFM amplo (estilo Dinzo).
> Build faseado: cada fase entrega valor independente.

## Wedge (posicionamento)

**"Seu assistente financeiro no WhatsApp — conecte seus bancos e entenda suas finanças em segundos."**

---

## Fase 0 — Fundação (sem ela nada funciona)

### MUST
- Auth: signup / login / recuperação de senha (Supabase Auth — email/OTP + Google OAuth)
- Middleware de proteção de rotas (Next.js `proxy` + Supabase SSR)
- Schema Supabase com RLS por usuário: `profiles`, `accounts`, `transactions`, `categories`, `cards`, `installments`, `budgets`, `goals`, `investments`, `subscriptions`, `alerts`, `whatsapp_links`
- Shell autenticado: dashboard (vazio), contas, transações, configurações — layout + nav

---

## Fase 1 — Open Finance (Pluggy)

### MUST
- Pluggy Connect (widget de consentimento OAuth) + troca de token server-side
- Sync inicial de contas, cartões, transações, investimentos → tabelas Supabase
- Webhook Pluggy + job de sync recorrente (Supabase Edge Function cron)
- Motor de categorização: regras determinísticas + fallback IA (Claude Haiku) para casos ambíguos
- Categorias editáveis pelo usuário

### SHOULD
- Suporte a 100+ bancos (via Pluggy)
- Reconexão e gestão de consentimentos expirados

---

## Fase 2 — Inteligência financeira

### MUST
- **Motor de fatura projetada**: fatura atual + próximas + comprometido por mês (cálculo server-side, unit tested)
- **Mapa de parcelas futuras**: comprometimento mês a mês à frente
- Dashboard com saldo, gastos por categoria, fatura projetada, investimentos consolidados
- Detecção de assinaturas recorrentes e cobranças duplicadas
- "Limite seguro do mês"

### SHOULD
- Previsão de fatura por IA
- Consolidação de dividendos e rendimentos para IR
- Simulador de quitação (bola de neve / avalanche)
- Alertas in-app: orçamento próximo do limite, fatura prestes a fechar

---

## Fase 3 — Assistente WhatsApp (Evolution API)

### MUST
- Self-host Evolution API (Docker) + webhook inbound
- Vínculo telefone→usuário (`whatsapp_links` + código de pareamento)
- Parsing de mensagens texto via Claude: registro de transações, consulta de saldo/fatura
- Alertas outbound: orçamento, pré-fechamento, parcelas comprometidas

### SHOULD
- Parsing de áudio (transcrição → mesmo pipeline)
- Respostas ricas (listas formatadas, valores em negrito)
- Abstração do provider (`src/lib/whatsapp/`) para trocar por Cloud API depois

---

## Fase 4 — Monetização

### MUST
- Planos: Free (14 dias trial de tudo) → Pago (R$19,90/mês · R$49,90/tri · R$149,90/ano)
- Mercado Pago Assinaturas: Pix + cartão recorrente
- Webhook de pagamento → estado de assinatura → gating de features
- Dunning / retry automático

### SHOULD
- Portal de gerenciamento de assinatura (cancelar, trocar plano)
- Preço de fundador travado para early adopters

---

## FORA DO MVP (decisão consciente)

- **App nativo** — começa PWA (Next.js).
- **WhatsApp Cloud API oficial** — migra antes de escalar 1k+ usuários ativos.
- **IR automático** — fase futura; por ora: consolidação de dados para o usuário preencher.
- **Compartilhamento familiar** — fase futura.
- **Marketplace de produtos financeiros** (CCI, CDB, seguros) — receita futura.

---

## Hipóteses a validar no MVP

- H1 Ativação ≥ 40% (signup → conecta conta Open Finance)
- H2 Retenção W4 ≥ 25%
- H3 Trial→pago ≥ 15%
- H4 WhatsApp como canal primário de uso diário (≥3 mensagens/semana por usuário ativo)

---

## Arquitetura resumo

Next.js 16 (App Router) + Supabase (Auth + Postgres + Edge Functions + RLS) + Tailwind v4 + shadcn/ui. Cálculo financeiro e validação **no servidor**. Secrets server-only (nunca `NEXT_PUBLIC_` para chaves de serviço).
