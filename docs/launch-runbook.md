# Runbook de lançamento

Todos os bloqueios restantes são **externos** (domínio, credenciais de produção,
número de WhatsApp) e devem chegar poucos dias antes do lançamento. Este arquivo
existe para que esse dia seja **mecânico**, não exploratório: cada passo tem o que
fazer, onde, e como verificar antes de seguir.

> **Segredos**: nada de valor real aqui. Tudo por nome de variável.

## ⚠️ A ordem importa

**O domínio vem primeiro.** As URLs de webhook do Pluggy e do Mercado Pago, o
`back_url` do checkout e as redirect URLs do Supabase Auth todas apontam para o
endereço final da aplicação. Registrar webhooks de produção antes de ter o domínio
significa registrar tudo duas vezes — e uma delas vai ser esquecida.

```
1. Domínio  →  2. Pluggy prod  →  3. Mercado Pago prod  →  4. WhatsApp  →  5. Faxina
```

O WhatsApp é o único que não depende do domínio (a Evolution chama nossa API pelo
endereço que estiver configurado), então pode ser feito em paralelo se preferir.

---

## 0. Pré-voo (dá para fazer ANTES de qualquer credencial chegar)

- [ ] `pnpm lint && pnpm test && pnpm build` verdes na `main`.
- [ ] Conferir que os crons estão no [`vercel.json`](../vercel.json): sync (6h),
      dunning (8h), whatsapp-alerts (9h), monthly-close (dia 1º, 12h).
- [ ] Decidir o preço final em [`plans.ts`](../src/lib/payments/plans.ts) — depois
      do lançamento, mexer em preço com assinantes ativos é mais chato.
- [ ] Restaurar o trial das contas de teste (foi estendido manualmente para
      2026-08-29 durante o desenvolvimento) ou apagá-las.

---

## 1. Domínio (Registro.br → Vercel → Supabase)

1. **Vercel**: projeto `zap-financas` → **Settings → Domains → Add** → digitar o
   domínio. A Vercel mostra os registros DNS necessários.
2. **Registro.br**: painel do domínio → DNS → apontar conforme a Vercel pediu
   (normalmente `A` para o apex e `CNAME` para `www`). Propagação: minutos a horas.
3. **Vercel → Environment Variables**: trocar `NEXT_PUBLIC_APP_URL` para
   `https://<dominio>` (Production). **Redeploy** — variável nova só vale em build novo.
4. **Supabase** (projeto `vtbpadfrguerropwwdbj`) → **Authentication → URL
   Configuration**: `Site URL` = `https://<dominio>`; adicionar
   `https://<dominio>/**` nas *Redirect URLs* (manter a `.vercel.app` enquanto
   testa, remover depois).
5. **Vercel → Deployment Protection**: com domínio próprio, dá para religar
   **Standard Protection** (domínio público, previews protegidos). Hoje está
   desligado porque o plano free só permitia tudo-ou-nada.

**Verificar antes de seguir:**
- [ ] `https://<dominio>` abre a landing (HTTP 200).
- [ ] Signup + login + link de confirmação de e-mail funcionam **no domínio novo**
      (se o Supabase não estiver configurado, o link volta para a URL antiga).

---

## 2. Pluggy em produção

O código **não muda** — só as credenciais e uma flag. O widget Pluggy Connect já
está implementado ([`pluggy-connect-button.tsx`](../src/components/app/pluggy-connect-button.tsx)).

1. **Vercel → Environment Variables** (Production):
   - `PLUGGY_CLIENT_ID` / `PLUGGY_CLIENT_SECRET` → credenciais de **produção**.
   - `PLUGGY_INCLUDE_SANDBOX` → **`false`** (senão os bancos-fake de teste
     aparecem para o usuário final).
   - `PLUGGY_WEBHOOK_SECRET` → gerar um novo segredo forte.
2. **Redeploy.**
3. **Registrar o webhook** na conta de produção da Pluggy apontando para o
   domínio novo. Atenção: o Pluggy **não assina** webhooks com HMAC — validamos
   por token na querystring, então o token vai na URL:
   ```
   POST https://api.pluggy.ai/webhooks
   { "url": "https://<dominio>/api/webhooks/pluggy?token=<PLUGGY_WEBHOOK_SECRET>",
     "event": "item/updated" }
   ```

**Verificar antes de seguir:**
- [ ] `/contas → Conectar conta` abre o widget mostrando **bancos reais** (sem "Pluggy Bank").
- [ ] Conectar **uma conta real de verdade** e conferir que contas/transações/cartões
      sincronizam e aparecem categorizados.
- [ ] Webhook sem token → 401; com token → 200.

---

## 3. Mercado Pago em produção

1. No painel MP, sair do **Modo de teste** → pegar as credenciais de **produção**
   da aplicação de Assinaturas.
2. **Vercel → Environment Variables** (Production): `MERCADOPAGO_ACCESS_TOKEN`,
   `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`, e `MERCADOPAGO_WEBHOOK_SECRET`
   (o segredo do webhook de **produção** é diferente do de teste).
3. **Redeploy.**
4. **Webhook** no painel MP (modo produção), evento *Planos e assinaturas* →
   `https://<dominio>/api/webhooks/mercadopago`.

**Verificar antes de seguir:**
- [ ] `/assinar` → escolher plano → `init_point` abre o checkout **real**.
- [ ] Fazer **uma assinatura de verdade** (pode cancelar depois) e confirmar que o
      webhook ativou o acesso.
- [ ] Assinatura forjada no webhook → **401** (a validação de `x-signature` já
      está implementada e foi testada em sandbox).

---

## 4. WhatsApp (número dedicado)

⚠️ **Nunca parear o número pessoal de ninguém.** A Evolution vira "aparelho
conectado" e espelha todas as conversas — foi exatamente isso que causou o
incidente de 2026-07-06 (ver [`evolution-whatsapp.md`](evolution-whatsapp.md)).

Infra já está pronta e no ar: Evolution v2.3.7 na Railway, instância `zapfinancas`,
variáveis já configuradas na Vercel. Falta só pareá-la a um número.

1. Abrir o **Manager** da Evolution (`<EVOLUTION_API_URL>/manager`), autenticar com
   a `AUTHENTICATION_API_KEY`.
2. Instância `zapfinancas` → **Connect** → escanear o QR **com o chip dedicado**.
   Status deve virar `open`.
3. **Religar o webhook** (está `enabled:false` desde o incidente). Se o domínio já
   estiver de pé, use-o na URL:
   ```
   POST <EVOLUTION_API_URL>/webhook/set/zapfinancas
   header: apikey: <AUTHENTICATION_API_KEY>
   { "webhook": { "enabled": true,
       "url": "https://<dominio>/api/webhooks/whatsapp",
       "headers": { "apikey": "<WHATSAPP_WEBHOOK_SECRET>" },
       "byEvents": false, "base64": false,
       "events": ["MESSAGES_UPSERT"] } }
   ```
4. Se o domínio mudou, conferir também `EVOLUTION_API_URL`/`EVOLUTION_INSTANCE` na
   Vercel (não mudam) — o que muda é só a URL do webhook acima.

**Verificar (de um SEGUNDO número, não o do bot):**
- [ ] Gerar código em **Configurações → WhatsApp**, enviar ao bot → "WhatsApp conectado!"
- [ ] `saldo` → valor correto · `fechamento` → resumo do mês passado
- [ ] **Áudio** falando "gastei cinquenta no mercado" → registra
- [ ] **Foto de nota fiscal** → registra o total e lista os itens
- [ ] Mandar mensagem de um número **não vinculado** → **silêncio** (anti-spam)
- [ ] Mandar mensagem em um **grupo** com o bot → **silêncio**

> Os três primeiros caminhos (roteamento, NLU, leitura de nota) já foram validados:
> a NLU e a extração de nota fiscal contra o Gemini real, e o webhook por 20 testes
> de integração com payloads da Evolution. O único elo que **só** dá para testar com
> número pareado é o download de mídia (`getBase64FromMediaMessage`) — se falhar,
> o usuário recebe mensagem amigável em vez de erro, e o log mostra a causa.

---

## 5. Faxina pós-lançamento

- [ ] **Railway**: apagar o projeto antigo. Identificação segura — o projeto a
      **manter** é o que serve a URL da Evolution que responde HTTP 200
      (`/` devolve *"Welcome to the Evolution API"*); o projeto a **apagar** tem os
      serviços `nginx` e `keen-rejoicing`, e suas URLs devolvem **404**.
      Projeto → **Settings → Danger → Delete Project** (pede o nome para confirmar).
- [ ] Remover as contas de teste (`*@zapfin.dev`) do Supabase.
- [ ] Revogar tokens de API criados para setup (o token da Vercel já foi revogado).
- [ ] Confirmar que os 4 crons rodaram (Vercel → Logs, filtrando `/api/cron/`).

---

## Se algo der errado

- **Rollback de deploy**: Vercel → Deployments → deploy anterior → *Promote to Production*.
- **Voltar Pluggy/MP para sandbox**: trocar as credenciais de volta e redeploy —
  a seleção de provider é por env, sem mudança de código.
- **Desligar o bot na hora**: `POST <EVOLUTION_API_URL>/webhook/set/zapfinancas`
  com `enabled:false` interrompe imediatamente qualquer resposta.
