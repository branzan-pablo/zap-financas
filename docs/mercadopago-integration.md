# Integração Mercado Pago — o que foi verificado e o que não foi

> **Estado (2026-08-08):** credenciais de **produção** (`APP_USR-`) no ar, webhook
> configurado, e o fluxo exercitado contra a API real até onde o Mercado Pago
> permite. O que falta depende de um pagamento **aprovado** — ver "O que não foi
> verificado" no fim.

Aplicação única: **Zap Financas BR**, `5022148820763332`, recebedor `1967760479`.
Como só existe uma aplicação, o `MERCADOPAGO_WEBHOOK_SECRET` é o mesmo em teste
e em produção — trocar de modo não invalida a assinatura já validada.

## Arquitetura

- Abstração em `src/lib/payments/` — trocar de provider não toca em UI/gating.
- **Assinatura**: `criarCheckout` → `POST /preapproval` sem plano associado e com
  `status: "pending"`, o padrão documentado para quando o meio de pagamento não é
  definido na criação. Retorna `init_point`; o usuário escolhe como pagar lá.
- **Cancelamento**: `PUT /preapproval/{id} { status: "cancelled" }`.
  `cancelarMinhaAssinatura` chama o provider ANTES de atualizar o banco — senão o
  MP continuaria cobrando enquanto o usuário acha que cancelou.
- **Webhook** (`/api/webhooks/mercadopago`): valida `x-signature` → consulta o
  recurso na API → atualiza estado. Fail closed em produção se o provider for mock.
- **Estado/gating**: `subscription.ts` (escrita via service_role) + `access.ts`
  (regra pura e testada) usada no layout `(app)`.

## ✅ Verificado contra a API real

| # | O quê | Evidência |
|---|---|---|
| 1 | **Template do `x-signature`** | Notificação real do painel do MP → **200**. Assinatura forjada ou ausente → **401**. `notifications_history`: 1 entrega, 100% de sucesso |
| 2 | **Corpo do `preapproval`** | **201** nos três planos. `auto_recurring` devolvido com `1/3/12 months`, `19.9/49.9/149.9`, `BRL` — bate com `plans.ts` |
| 3 | **`init_point`** | Presente. **`sandbox_init_point` não existe neste fluxo** — o ramo `this.sandbox` do `criarCheckout` nunca se aplica, o fallback cobre |
| 4 | **Grafia do cancelamento** | `{"status":"cancelled"}` → **200**. `{"status":"canceled"}` → **400** `Invalid preapproval status param` |
| 5 | **Tópicos do webhook** | `subscription_preapproval` **e** `subscription_authorized_payment` inscritos. O segundo estava faltando: sem ele, **renovação mensal nunca notificaria** |
| 6 | **Checkout ponta a ponta** | `liveMode: true`, R$ 19,90, cartão tokenizado, MP processou e devolveu veredito |
| 7 | **Cancelamento por evento real** | Após a recusa, o MP cancelou o preapproval e notificou. O webhook processou e gravou `cancelado` — **e a notificação veio com `cancelled`, dois "l"**, confirmando o item 4 pelo lado da leitura |
| 8 | **Entrega dos dois tópicos** | `notifications_history`: 10 notificações, 8 `subscription_preapproval` + 2 `subscription_authorized_payment`, **100% em HTTP 200** |

### ⚠️ A documentação do MP mente sobre o cancelamento

A doc oficial usa `canceled` (um "l") em 12 ocorrências e `cancelled` em nenhuma.
**A API faz o contrário.** Isso já foi "corrigido" uma vez seguindo a doc e teve
de ser revertido — ver o comentário em `mercadopago-provider.ts` e o teste que
trava a string. Não refaça esse caminho.

### 🚫 O sandbox de assinaturas está indisponível para esta conta

```
POST /preapproval  (credenciais TEST-)
→ 400 {"message":"Both payer and collector must be real or test users"}
```

As credenciais `TEST-` pertencem à conta **real**, e assinatura exige pagador e
recebedor do mesmo tipo. Testado inclusive com comprador de teste criado pelo MCP
oficial — mesmo 400. Sair disso exigiria um vendedor de teste com aplicação
própria, o que traria um segundo `MERCADOPAGO_WEBHOOK_SECRET` e invalidaria a
validação do item 1. **A validação é feita em produção.**

### 🚫 O dono da conta não consegue testar pagando a si mesmo

```
payment_status_detail: cc_rejected_high_risk
```

Conta MP nova + cartão do mesmo titular do vendedor = padrão de teste de cartão
roubado para o antifraude. Recusa sistemática, independente do cartão. Para
exercitar um pagamento **aprovado** é preciso um terceiro, com conta e CPF
próprios.

## ❌ O que não foi verificado

Tudo aqui depende de um pagamento aprovado:

1. **Mapa de status** — falta `authorized` e `paused` no preapproval, e
   `approved`/`processed` no authorized_payment. O `cancelled` já foi exercitado
   por evento real (item 7 acima), e o tópico `authorized_payment` já entregou —
   só não com um pagamento bem-sucedido.
2. **`next_payment_date` na autorização** — enquanto `pending`, ele volta como o
   *instante da criação*. Se vier assim na autorização, gravaríamos um período já
   vencido. **Mitigado por construção**: `ativarAssinatura` descarta data no
   passado ou ilegível e cai no ciclo do plano, com aviso no log.
3. **Renovação recorrente** — o `subscription_authorized_payment` só agora está
   inscrito; nenhuma renovação ocorreu ainda.
4. **Dunning** — `marcarInadimplente` nunca foi acionado por evento real.
5. **Pix Automático** — fora de escopo desta rodada. Cartão é o caminho de
   lançamento. Exige habilitar na conta e a 1ª autorização no app do banco.

### Como fechar o que falta

Uma assinatura de R$ 19,90 paga por **outra pessoa** (conta MP e CPF próprios),
seguida de cancelamento e estorno. Verificar depois:

- `notifications_history` registra `subscription_preapproval` **aprovado**
- `subscriptions`: `status = ativo`, `periodo_fim` ~1 mês à frente
- se o log trouxer `periodo_fim ... inválido`, o `next_payment_date` do MP é
  inservível e a rede de segurança agiu — vale abrir chamado com eles
- `/dashboard` abre sem paywall
- cancelamento em `/assinar` → `cancelled` no MP **e** `cancelado` no banco

## Pendências conhecidas
- Reconciliação periódica (GET das assinaturas ativas) como rede de segurança.
- Tratar `paused` (MP pausa por falha de cobrança) além de cancelled/authorized.
- Trocar de plano sem cancelar (upgrade/downgrade).
- `X-Idempotency-Key` não impede um segundo preapproval depois de ~1h; o webhook
  já lida com isso resolvendo pelo `external_reference`.
