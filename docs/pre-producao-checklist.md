# Checklist pré-produção — o que depende de você

Complemento da auditoria de segurança de 2026-08-06.

---

## Estado atual (2026-08-06)

| Camada | Situação |
|---|---|
| **Banco** | ✅ 3 migrations aplicadas — escalação de privilégio **fechada** |
| **Código** | ⚠️ correções prontas, **não commitadas**, branch `anime-prototipo` |
| **Produção** | ❌ rodando código antigo — **cadastro quebrado**, sem headers de segurança |
| **Domínio** | ⚠️ `zapfinancas.com.br` registrado e na conta Vercel; **sem DNS**, sem deploy |

> ⚠️ **Banco e código estão dessincronizados.** As migrations criaram
> `ajustar_saldo` e `whatsapp_processed`, mas o código em produção não usa
> nenhum dos dois. É seguro (migrations aditivas não quebram código antigo), mas
> a race condition de saldo e a duplicação de gastos **continuam acontecendo**
> até o deploy.

## Ordem de execução

```
P0 deploy+domínio → P1 receita → P2 operação → P3 conformidade
```

Cada bloco abaixo tem **quem faz**. Nada em P1+ adianta antes do P0 fechar.

---

## P0 — Bloqueia o lançamento

Sem isto, o produto não funciona para ninguém.

| # | O quê | Por quê | Quem | Onde |
|---|---|---|---|---|
| 1 | **Commitar + deployar as correções** | Cadastro está quebrado em produção (B1). Nenhum header de segurança no ar | eu, com seu ok | §0 |
| 2 | **Criar registros DNS** | Domínio não resolve | **você** | §1.5-B |
| 3 | **Anexar domínio ao projeto** | Vercel não serve o domínio | **você** (30s no painel) | §1.5-A |
| 4 | **`NEXT_PUBLIC_APP_URL` + redeploy** | Callback e prévias apontam para o `.vercel.app` | eu, após DNS | §1.5-C |
| 5 | **Supabase: Redirect URLs** | Link de confirmação vai para domínio não autorizado | **você** | §2.1 |

---

## P0.5 — Antes de qualquer usuário real conectar banco

| # | O quê | Por quê | Quem |
|---|---|---|---|
| 6 | **`PLUGGY_INCLUDE_SANDBOX=false`** na Vercel | A variável **não está setada**. O código faz `!== "false"`, então o padrão é `true`: o widget mostra **bancos-fake de teste** para o usuário final | **você** |

Uma variável. Confirmado em [contas/page.tsx:71](<../src/app/(app)/contas/page.tsx#L71>) → widget `PluggyConnect`.

---

## P1 — Bloqueia receita

| # | O quê | Por quê | Quem |
|---|---|---|---|
| 7 | **B5 — validar `x-signature` do MP** | Se o manifest estiver errado, o webhook rejeita tudo: **cliente paga e não recebe acesso**, em silêncio | você captura, eu rodo o script |
| 8 | **B5 — fluxo de pagamento no sandbox** | Campos do preapproval e mapa de status nunca exercitados | **você** |

Detalhe em §3. O item 7 é o mais arriscado e o que fecha mais rápido.

---

## P2 — Antes de escalar

Não bloqueia o lançamento; bloqueia dormir tranquilo depois dele.

| # | O quê | Por quê | Quem | Esforço |
|---|---|---|---|---|
| 9 | **Sentry** | Hoje um webhook quebrado falha mudo — exatamente o risco do B5. Você descobre por reclamação | eu (precisa do DSN) | baixo |
| 10 | **Rate limiting** | Login sem defesa contra brute force | eu | médio |
| 11 | **Audit log + soft delete** | `excluirLancamento` faz hard delete; saldo muda sem rastro | eu | médio |
| 12 | **Senha 12 chars no Supabase** | Servidor já exige; painel ainda em 6 → mensagem inconsistente | **você** | 1 min |
| 13 | **Zod nos webhooks** | Payload de terceiro lido sem validar forma | eu | baixo |

---

## P3 — Conformidade e polimento

| # | O quê | Quem |
|---|---|---|
| 14 | **Termos de Uso** — cobrança recorrente sem ToS é exposição (CDC) | você (texto jurídico) |
| 15 | **MFA** — precisa de tela de enrollment, não é flag de painel | eu |
| 16 | **Faxina** — contas de teste, projeto Railway antigo, alias `.vercel.app` | você ([runbook §5](launch-runbook.md)) |
| 17 | **Pareamento do WhatsApp** — número dedicado + religar webhook | você ([runbook §4](launch-runbook.md)) |

---

## §0 — Commit e deploy (P0 #1)

Duas ressalvas antes:

1. **A árvore está misturada.** Junto com as correções de segurança há trabalho
   de animação (`meter.tsx`, `dashboard/page.tsx`, `fatura-signature.tsx`,
   `motion.ts`, `animated-number.tsx`). Um `git add .` empacota tudo num commit.
   Separe: segurança num, animação em outro.
2. **Branch é `anime-prototipo`**, produção deploya de `main`.

O resto deste arquivo é o detalhe de cada item.

---

---

## 1. Aplicar as migrations ⚠️ MAIS URGENTE

Três migrations novas estão no repositório mas **não valem nada até rodarem no
banco**. Enquanto isso, a falha de escalação de privilégio continua explorável.

```bash
npx supabase db push
```

| Migration | O que trava |
|---|---|
| `20260806000001_profiles_column_grants` | Usuário escrevendo `plano`/`trial_ends_at` — acesso pago vitalício de graça |
| `20260806000002_ajustar_saldo_atomico` | Race condition que corrompe saldo em lançamentos concorrentes |
| `20260806000003_whatsapp_dedup` | Reentrega da Evolution registrando o mesmo gasto 2× |

**Confirme que pegou** (SQL Editor do Supabase):

```sql
-- Quais colunas de `profiles` o papel `authenticated` ainda pode escrever.
-- Deve retornar EXATAMENTE 4: nome, avatar_url, telefone, onboarding_done_at
select a.attname as coluna
  from pg_attribute a
 where a.attrelid = 'public.profiles'::regclass
   and a.attnum > 0 and not a.attisdropped
   and has_column_privilege('authenticated', a.attrelid, a.attnum, 'UPDATE')
 order by 1;

-- Cada uma deve retornar 1 linha
select proname from pg_proc where proname = 'ajustar_saldo';
select tablename from pg_tables where tablename = 'whatsapp_processed';
```

> `has_column_privilege` é a fonte autoritativa — diz o que o Postgres de fato
> aplica, sem depender das regras de visibilidade do `information_schema`.

> Se a primeira query devolver `plano` ou `trial_ends_at`, a migration **não**
> aplicou — não siga adiante.

---

## 1.5 Domínio — `zapfinancas.com.br` (Registro.br → Vercel)

**A ordem importa.** As URLs de webhook (Pluggy, MP, Evolution), o `back_url` do
checkout e as redirect URLs do Supabase apontam todas para o domínio final.
Configurar qualquer uma antes de o domínio existir significa refazer — e uma vai
ser esquecida.

### A. Vercel primeiro (para saber quais registros criar)

**Vercel → projeto `zap-financas` → Settings → Domains → Add**

Adicione **os dois**: `zapfinancas.com.br` e `www.zapfinancas.com.br`. A Vercel
pergunta qual é o principal e cria o redirect do outro automaticamente.
Recomendo o **apex** (`zapfinancas.com.br`) como principal — mais curto para
digitar e para ditar por WhatsApp.

**Registros confirmados** — obtidos de `vercel domains inspect zapfinancas.com.br`
em 2026-08-06, não de tutorial:

| Tipo | Nome | Valor |
|---|---|---|
| `A` | `@` (apex) | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

> Se a Vercel exibir valores diferentes dos acima na tela de Domains, **use os
> dela**: o IP do apex já mudou mais de uma vez, e um IP velho leva a um domínio
> que resolve para lugar nenhum — falha silenciosa e chata de diagnosticar.

### B. Registro.br

Estado verificado em 2026-08-06 (via RDAP):

```
status      : active
nameservers : a.auto.dns.br, b.auto.dns.br   ← DNS automático do Registro.br
expiration  : 2028-08-06
```

O domínio já está publicado e usando o **DNS automático do Registro.br**. Isso é
bom: **não mexa em servidor DNS**. Falta só criar os registros.

Painel do domínio → **DNS → Editar zona** → adicione as duas entradas da tabela
acima → **Salvar**.

> **Por que não delegar para os nameservers da Vercel?** Funcionaria, mas trocar
> agora cria um ovo-e-galinha: o Registro.br só republica depois que os
> nameservers novos respondem pela zona. Você já está publicado — mantenha. Como
> bônus, o editor de zona fica no registrador caso queira e-mail (`MX`) depois.

Propagação: minutos, às vezes algumas horas. Acompanhe:

```bash
nslookup zapfinancas.com.br
nslookup www.zapfinancas.com.br
```

Quando a Vercel mostrar **Valid Configuration**, ela emite o certificado TLS
sozinha (Let's Encrypt). Não precisa fazer nada para o HTTPS.

### C. Vercel → Environment Variables

```
NEXT_PUBLIC_APP_URL=https://zapfinancas.com.br
```

Em **Production**. Depois **redeploy** — variável nova só entra em build novo.

Essa variável agora controla três coisas: o callback de autenticação
([actions.ts](<../src/app/(auth)/actions.ts>)), o `back_url` do checkout, e o
`metadataBase` das prévias de link ([layout.tsx](../src/app/layout.tsx)). Se
ficar errada, o cadastro quebra e as prévias no WhatsApp apontam para fora.

### D. Atualizar as URLs externas

Com o domínio de pé, aponte tudo para ele:

- **Supabase** → §2.1 abaixo
- **Pluggy** → webhook `https://zapfinancas.com.br/api/webhooks/pluggy?token=<PLUGGY_WEBHOOK_SECRET>`
- **Mercado Pago** → webhook `https://zapfinancas.com.br/api/webhooks/mercadopago`
- **Evolution** → webhook `https://zapfinancas.com.br/api/webhooks/whatsapp`
  (ver [launch-runbook.md §4](launch-runbook.md) para o `POST` completo)

### Sobre o HSTS (nenhuma ação necessária)

O header vai como `max-age=63072000; includeSubDomains` — **sem** `preload`.
Decisão consciente, registrada aqui para não ser "corrigida" depois por engano.

**O que o HSTS faz:** quem digita `zapfinancas.com.br` sem o `https://` tem o
navegador tentando HTTP primeiro. Nesse intervalo, em rede hostil (wi-fi de
café), dá para interceptar e servir uma cópia falsa. O header manda o navegador
usar HTTPS sempre, por 2 anos, sem nem tentar HTTP.

**A brecha que sobra:** o navegador só aprende isso na primeira visita
bem-sucedida. A *primeiríssima* ainda passa por HTTP.

**A lista de preload** fecha essa brecha — é uma lista embutida no binário do
Chrome/Firefox/Safari, então o navegador já vem sabendo. Parece só vantagem, mas:

- Sair da lista leva **meses** (depende do ciclo de release dos navegadores).
- Com `includeSubDomains`, todo subdomínio futuro precisa de TLS válido para
  sempre — um `blog.zapfinancas.com.br` em host sem HTTPS fica inacessível, sem
  opção de "continuar mesmo assim" para o usuário.
- **O token `preload` no header é o próprio consentimento.** O hstspreload.org
  não verifica se quem submete é dono do domínio: ele verifica se o header traz
  a palavra. Anunciar `preload` sem querer entrar na lista deixa a porta aberta
  para um terceiro nos submeter.

Por isso o token não está lá. Trocamos a proteção da primeira visita de um
visitante novo em rede hostil (real, mas raro) por não ter uma decisão
irreversível na mão de qualquer um.

Se um dia quiser entrar na lista: adicione `; preload` de volta ao header em
[next.config.ts](../next.config.ts), confirme que **todos** os subdomínios
servem HTTPS, e só então submeta.

---

## 2. Supabase → Authentication

### 2.1 Redirect URLs (senão ninguém se cadastra)

O código chamava `/auth/callback`, que não existe — a rota é `/callback`. Já
corrigido no código, mas o Supabase precisa aceitar a URL:

**Authentication → URL Configuration**
- `Site URL` = `https://zapfinancas.com.br`
- Em *Redirect URLs*, adicione `https://zapfinancas.com.br/**`
  (cobre `/callback` e o `?next=` do reset de senha)

Mantenha a URL `.vercel.app` na lista enquanto testa; remova depois do lançamento.

### 2.2 Política de senha

O servidor agora exige **12 caracteres com letras e números**
([actions.ts](<../src/app/(auth)/actions.ts>)). Alinhe o Supabase para que a
mensagem de erro seja consistente:

**Authentication → Sign In / Providers → Email**
- *Minimum password length*: `12`
- *Password Requirements*: letras e dígitos

### 2.3 MFA (opcional, mas recomendado)

Habilitar TOTP no painel **não é suficiente** — precisa de tela de enrollment e
de verificação no login, que ainda não existem. Se quiser MFA, é trabalho de
código; me avise que eu implemento. Não marque como feito só por ligar no painel.

---

## 3. B5 — Validar o webhook do Mercado Pago 🔴 BLOQUEADOR

**O risco:** `assinaturaValida()` monta o manifest do `x-signature` a partir da
documentação, nunca de uma notificação real. Se o formato estiver errado, o
webhook devolve 401 em **toda** notificação — o cliente paga, o MP registra a
cobrança, e o acesso nunca libera. Falha silenciosa: só um `console.warn`.

### 3.1 Capturar uma notificação real

1. Painel MP em **modo teste** → suas credenciais `TEST-...`
2. **Webhooks → Configurar notificações** → URL apontando para um endpoint que
   você consiga inspecionar. Três opções, da mais simples à mais fiel:
   - `webhook.site` — copia os headers na hora, não precisa rodar nada
   - `ngrok http 3000` → aponta para seu `localhost`
   - deploy de preview na Vercel → ler em **Logs**
3. Evento **"Planos e assinaturas"** → botão **Simular notificação**
4. Anote três coisas: a **URL completa** (com `?data.id=...`), o header
   **`x-signature`** e o header **`x-request-id`**

### 3.2 Conferir o template

```bash
node scripts/verificar-assinatura-mp.mjs \
  --url "<URL completa que o MP chamou>" \
  --signature "<header x-signature>" \
  --request-id "<header x-request-id>" \
  --secret "<MERCADOPAGO_WEBHOOK_SECRET do painel de TESTE>"
```

O script testa o template atual e mais 4 variações conhecidas:

- ✅ **"O template implementado está CORRETO"** → esta parte do B5 está fechada
- ❌ **"O que bate é: <outro>"** → ajuste o manifest em
  [mercadopago-provider.ts](../src/lib/payments/mercadopago-provider.ts)
  (método `assinaturaValida`) e rode de novo
- ❌ **"NENHUM candidato bateu"** → quase sempre é segredo trocado. O do painel
  de teste é **diferente** do de produção

### 3.3 Fluxo ponta a ponta no sandbox

Com o template confirmado, exercite o ciclo real:

- [ ] `/assinar` → escolher plano → abre o `sandbox_init_point`
- [ ] Pagar com [cartão de teste do MP](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/test/cards)
- [ ] **No banco**: `select status, periodo_fim from subscriptions where user_id = '<uid>'`
      → `ativo`, com `periodo_fim` vindo do `next_payment_date` do MP
- [ ] `/dashboard` abre sem paywall
- [ ] Cancelar em `/assinar` → status `cancelado`, acesso mantido até `periodo_fim`
- [ ] Webhook com assinatura inventada → **401**

Os itens 2–6 de [mercadopago-integration.md](mercadopago-integration.md#-checklist-obrigatório-no-sandbox-antes-de-produção)
(campos do preapproval, mapa de status, Pix Automático) continuam valendo — o
script cobre só o item 1, que era o mais arriscado.

---

## 4. Vercel → Environment Variables

⚠️ **Mudança de comportamento:** os providers agora **falham alto** em produção
em vez de cair no mock. Sem estas variáveis o app quebra — de propósito, porque
o silêncio anterior era pior (mock não cobra, não entrega, e injeta dados falsos).

Obrigatórias em **Production**:

```
PAYMENTS_PROVIDER=mercadopago      # sem isso, /assinar lança erro
OPENFINANCE_PROVIDER=pluggy        # sem isso, /contas lança erro
WHATSAPP_PROVIDER=evolution        # sem isso, crons e webhook lançam erro
```

Mais as credenciais correspondentes e os segredos (`CRON_SECRET`,
`PLUGGY_WEBHOOK_SECRET`, `WHATSAPP_WEBHOOK_SECRET`, `MERCADOPAGO_WEBHOOK_SECRET`)
— todos já listados no [`.env.example`](../.env.example).

> Variável nova só vale em **build novo**. Redeploy depois de mexer.

---

## 5. Provar que as correções funcionam

Não confie no código: teste em preview com env de produção.

**Escalação de privilégio (o mais importante).** Logado, pegue seu JWT do
DevTools (cookie `sb-<ref>-auth-token`) e tente se dar trial infinito:

```bash
curl -X PATCH "https://<ref>.supabase.co/rest/v1/profiles?id=eq.<seu-uid>" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <SEU_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"trial_ends_at":"2099-01-01T00:00:00Z"}'
```

→ Esperado: **403**. Se retornar 200, a migration §1 não aplicou.

**Demais verificações:**

- [ ] Cadastro completo: signup → email → link → `/dashboard` (valida a rota `/callback`)
- [ ] Senha de 8 caracteres no signup → recusada pelo servidor
- [ ] `POST /checkout/mock/confirmarPagamento` em produção → redireciona, não ativa
- [ ] Cron sem `Authorization: Bearer` → **401**
- [ ] `curl -I https://zapfinancas.com.br` → HSTS, CSP, `X-Frame-Options: DENY`
- [ ] `curl -I http://zapfinancas.com.br` → redireciona para HTTPS
- [ ] `curl -I https://www.zapfinancas.com.br` → redireciona para o apex
- [ ] Compartilhar `https://zapfinancas.com.br` numa conversa de WhatsApp →
      prévia com título e descrição corretos (valida o `metadataBase`)
- [ ] Abrir `/dashboard` no browser e conferir o **console sem erro de CSP**
      (foi a única verificação que não consegui fazer localmente)
- [ ] Dois lançamentos simultâneos na mesma conta manual → saldo final correto
- [ ] Reenviar o mesmo payload no webhook do WhatsApp → `"mensagem já processada"`

---

## 6. Detalhe dos itens P2/P3

**Rate limiting (P2 #10)** — decisão de infra pendente: Vercel Firewall (mais
simples, já está na stack) ou Upstash (mais controle, custo à parte). Me diga a
preferência que eu implemento.

**Audit log (P2 #11)** — proposta: coluna `deleted_at` em `transactions`
(filtrada nas leituras) + tabela `audit_log` (user_id, tabela, operação,
valor_antes, valor_depois, timestamp) alimentada por trigger.

**MFA (P3 #15)** — habilitar TOTP no painel do Supabase **não é suficiente**:
falta tela de enrollment e passo de verificação no login. Não marque como feito
só por ligar no painel.

---

## Se algo der errado

Rollback de deploy: Vercel → Deployments → anterior → *Promote to Production*.

As migrations desta leva são **aditivas** (grants, uma função, uma tabela) e não
destroem dado — reverter o app não exige reverter o banco. Se precisar soltar os
grants em emergência:

```sql
grant update on public.profiles to authenticated;  -- reabre TODAS as colunas
```

...mas isso reabre a escalação de privilégio. Prefira corrigir o app.
