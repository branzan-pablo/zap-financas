# Evolution API (WhatsApp) — deploy, operação e incidente

Assistente de WhatsApp do Zap Finanças roda sobre a **Evolution API v2** (self-hosted).
O app fala com ela pela abstração em [`src/lib/whatsapp/`](../src/lib/whatsapp/); o
webhook inbound é [`/api/webhooks/whatsapp`](../src/app/api/webhooks/whatsapp/route.ts).

> **Segredos**: nada de chave/token neste arquivo. Tudo vive em `.env.local` (local,
> gitignored), na env da Vercel (app) e na env da Railway (Evolution). Aqui só
> referenciamos os **nomes** das variáveis.

## Infra (Railway)

- **Projeto**: `adventurous-fascination` (o antigo `enchanting-presence` foi descartado).
- **Serviços**: `evolution-api` (a API) + `Postgres` (banco do Prisma da Evolution).
- **Região**: US West.

### ⚠️ Gotcha crítico: NÃO usar a imagem Docker pré-buildada

Deployar a imagem `atendai/evolution-api:latest` (ou `evoapicloud/evolution-api`, ou
até o digest amd64 puro) **falha na Railway** com:

```
Deploy › Create container: Failed to create deployment
```

Erro **instantâneo (00:00), sem logs**, em qualquer região/variável. Provado por
eliminação que **não** é conta/plano/região/variável/imagem (um `nginx` sobe normal no
mesmo projeto; a imagem é pública/amd64/válida). É o runtime da Railway engasgando ao
criar o container **dessa** imagem.

**Solução**: deployar **do código-fonte**. Conecte o repo GitHub `EvolutionAPI/evolution-api`
como Source (builder Railpack) — a Railway compila e sobe sem problema.

### Postgres + Prisma

A Evolution roda migrations do Prisma no boot. Se `DATABASE_CONNECTION_URI` chegar
**vazio**, quebra com:

```
Prisma P1012 — Error validating datasource `db`:
You must provide a nonempty URL. (DATABASE_CONNECTION_URI resolveu para string vazia)
```

Ligue a referência **pelo autocomplete** da Railway (digite `${{` e escolha
`Postgres.DATABASE_URL`) — assim a referência é validada, não fica como texto solto.

### Variáveis (serviço `evolution-api` na Railway)

| Variável | Valor |
|---|---|
| `AUTHENTICATION_API_KEY` | chave global da API (segredo) |
| `AUTHENTICATION_TYPE` | `apikey` |
| `DATABASE_ENABLED` | `true` |
| `DATABASE_PROVIDER` | `postgresql` |
| `DATABASE_CONNECTION_URI` | `${{Postgres.DATABASE_URL}}` (referência) |
| `DATABASE_CONNECTION_CLIENT_NAME` | `evolution` |
| `CACHE_REDIS_ENABLED` | `false` |
| `CACHE_LOCAL_ENABLED` | `true` |
| `SERVER_PORT` | `8080` |
| `SERVER_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |

Gere o domínio público em **Settings → Networking → Generate Domain**, porta **8080**.

## Ligação com o app (Vercel)

O app escolhe o provider de WhatsApp por env (ver
[`src/lib/whatsapp/index.ts`](../src/lib/whatsapp/index.ts)). Variáveis na Vercel:

| Variável | Papel |
|---|---|
| `WHATSAPP_PROVIDER` | `evolution` (senão cai no mock) |
| `EVOLUTION_API_URL` | URL pública da Evolution na Railway |
| `EVOLUTION_API_KEY` | = `AUTHENTICATION_API_KEY` (envio de mensagens) |
| `EVOLUTION_INSTANCE` | nome da instância (ex.: `zapfinancas`) |
| `WHATSAPP_WEBHOOK_SECRET` | segredo que o webhook inbound valida |

> Variável nova na Vercel **só vale em deploy novo** — sempre force um redeploy.

## Webhook (Evolution → app)

Registrado por API. A Evolution v2.3.7 **aceita header customizado** no webhook, então
mandamos o `apikey` que o nosso `autorizado()` valida:

```bash
# Ligar o webhook
curl -X POST "$EVOLUTION_API_URL/webhook/set/$INSTANCE" \
  -H "apikey: $AUTHENTICATION_API_KEY" -H "Content-Type: application/json" \
  -d '{"webhook":{"enabled":true,
       "url":"'"$APP_URL"'/api/webhooks/whatsapp",
       "headers":{"apikey":"'"$WHATSAPP_WEBHOOK_SECRET"'"},
       "byEvents":false,"base64":false,"events":["MESSAGES_UPSERT"]}}'

# Desligar o webhook (para de enviar eventos ao app)
curl -X POST "$EVOLUTION_API_URL/webhook/set/$INSTANCE" \
  -H "apikey: $AUTHENTICATION_API_KEY" -H "Content-Type: application/json" \
  -d '{"webhook":{"enabled":false,"url":"...","events":[]}}'
```

Escutamos **só `MESSAGES_UPSERT`** (mensagens recebidas).

## Pareamento (vincular um usuário ao WhatsApp)

1. Usuário logado gera um código em **Configurações → WhatsApp**
   ([`/configuracoes/whatsapp`](../src/app/(app)/configuracoes/whatsapp/page.tsx)).
2. Envia esse código pelo WhatsApp **para o número do bot**.
3. O webhook casa o código (`whatsapp_links.codigo_pareamento`) e vincula o telefone.

## ⚠️ Incidente 2026-07-06 — bot no número pessoal spammou os contatos

**O que houve**: a instância foi pareada no **número pessoal** do dono. Como o webhook
respondia a **qualquer** mensagem recebida (contatos e grupos) com "número não
vinculado", todo mundo que mandava mensagem recebia a resposta do bot.

**Contenção imediata**: webhook `enabled:false` + `DELETE /instance/logout/$INSTANCE`
(instância desconectada, `state: close`).

**Blindagem no código** (commit `4887db9`, em
[`route.ts`](../src/app/api/webhooks/whatsapp/route.ts)):

- `extrair()` **ignora grupos** (`@g.us`) e `@broadcast` — o bot só atende conversas 1:1.
- Remetente **não vinculado → SILÊNCIO** (antes respondia a todos). O onboarding
  acontece só pelo código de pareamento gerado no app.

### Regra de ouro: o bot precisa de um NÚMERO DEDICADO

Nunca parear a Evolution no número pessoal de alguém. Ela vira "aparelho conectado"
(espelha todas as conversas) e o bot pode responder a quem não devia.

### Receita para religar com segurança

1. Ter um **número dedicado** (chip/número só do bot).
2. `/manager` → instância → **Connect** → parear o número dedicado via QR.
3. Religar o webhook (`enabled:true`, evento `MESSAGES_UPSERT`, header `apikey`).
4. Só então testar E2E (mandar mensagem de um **segundo** número → o bot responde).

## Comandos operacionais úteis

```bash
# Estado das instâncias
curl -H "apikey: $AUTHENTICATION_API_KEY" "$EVOLUTION_API_URL/instance/fetchInstances"

# Ver config do webhook
curl -H "apikey: $AUTHENTICATION_API_KEY" "$EVOLUTION_API_URL/webhook/find/$INSTANCE"

# Desconectar a instância do WhatsApp (mantém a config)
curl -X DELETE -H "apikey: $AUTHENTICATION_API_KEY" "$EVOLUTION_API_URL/instance/logout/$INSTANCE"

# Sanidade da API (welcome + versão)
curl "$EVOLUTION_API_URL/"
```
