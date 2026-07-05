# Deploy na Vercel — checklist

O deploy destrava de uma vez as URLs públicas dos webhooks (Pluggy, Mercado
Pago, Evolution) e os crons. Passos:

## 1. Conectar o repositório
Vercel → **Add New Project** → importe `zap-financas` do GitHub. Framework
detectado automaticamente (Next.js). Não precisa de build settings especiais.

## 2. Variáveis de ambiente (Production)
Cadastre em **Project → Settings → Environment Variables**. Nunca commitar —
copie os valores do seu `.env.local`.

**Prontos (já ligados):**
```
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO.vercel.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server-only
SUPABASE_URL=...                     # = NEXT_PUBLIC_SUPABASE_URL

AI_PROVIDER=gemini
GEMINI_API_KEY=...                   # server-only
GEMINI_MODEL=gemini-flash-latest

OPENFINANCE_PROVIDER=pluggy
PLUGGY_CLIENT_ID=...
PLUGGY_CLIENT_SECRET=...             # server-only
PLUGGY_WEBHOOK_SECRET=...            # defina um segredo; registre igual no Pluggy

CRON_SECRET=...                      # gere: openssl rand -hex 32
```

**Pendentes (preencher quando tiver as credenciais):**
```
# Mercado Pago (sandbox → produção)
PAYMENTS_PROVIDER=mercadopago
MERCADOPAGO_ACCESS_TOKEN=...         # TEST-... no sandbox
MERCADOPAGO_WEBHOOK_SECRET=...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=...

# WhatsApp (Evolution self-hosted)
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE=...
WHATSAPP_WEBHOOK_SECRET=...
NEXT_PUBLIC_WHATSAPP_NUMBER=...
```

> Enquanto MP/WhatsApp não estiverem prontos, **deixe `PAYMENTS_PROVIDER` e
> `WHATSAPP_PROVIDER` fora** (ou `=mock`) — o app cai no mock desses dois sem
> quebrar. Pluggy e Gemini já rodam reais.

## 3. Crons (já configurados em `vercel.json`)
- `/api/cron/sync` — 06:00 (sincroniza itens Open Finance)
- `/api/cron/dunning` — 08:00 (ciclo de inadimplência)
- `/api/cron/whatsapp-alerts` — 09:00 (alertas outbound)

A Vercel envia automaticamente `Authorization: Bearer <CRON_SECRET>` nas
chamadas de cron — as rotas já validam isso. **Sem `CRON_SECRET`, as rotas
recusam em produção (503).**

> Plano Hobby: crons rodam 1x/dia (as schedules acima são diárias). Para sync
> mais frequente (ex.: a cada 6h `0 */6 * * *`), precisa do plano Pro.

## 4. Registrar os webhooks nos providers (após o deploy)
Aponte cada um para o domínio de produção:
- **Pluggy** → `https://SEU-DOMINIO.vercel.app/api/webhooks/pluggy` (assinatura = `PLUGGY_WEBHOOK_SECRET`)
- **Mercado Pago** → `https://SEU-DOMINIO.vercel.app/api/webhooks/mercadopago` (secret = `MERCADOPAGO_WEBHOOK_SECRET`)
- **Evolution** → webhook inbound apontando para `https://SEU-DOMINIO.vercel.app/api/webhooks/whatsapp` (secret = `WHATSAPP_WEBHOOK_SECRET`)

## 5. Supabase
Já é cloud — nada a mudar. Confirme que a URL de produção está nas **Redirect
URLs** do Supabase Auth (Authentication → URL Configuration) para o OAuth/reset
funcionarem em produção.

## Ordem recomendada
1. Deploy com Supabase + Gemini + Pluggy + CRON_SECRET (já funciona).
2. Registrar webhook do Pluggy.
3. Quando o MP sandbox estiver pronto: add as vars MP + registrar webhook.
4. Quando a Evolution estiver de pé: add as vars + registrar webhook inbound.
