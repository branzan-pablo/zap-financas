# Integração Mercado Pago — notas e checklist de produção

> Estado: provider real implementado conforme a API documentada, **porém NÃO
> testado contra o sandbox**. Mock-first segue como default (`PAYMENTS_PROVIDER=mock`).
> Antes de cobrar de verdade, percorrer o checklist abaixo no sandbox.

## Arquitetura (como está)

- Abstração em `src/lib/payments/` — trocar de provider não toca em UI/gating.
- **Assinatura (preapproval)**: `criarCheckout` → `POST /preapproval` com
  `auto_recurring` (frequency/frequency_type/transaction_amount/currency_id BRL),
  `external_reference = userId`, `payer_email`, `back_url`. Retorna `init_point`
  (ou `sandbox_init_point` quando o token começa com `TEST-`).
- **Cancelamento**: `PUT /preapproval/{id} { status: "cancelled" }`. A ação
  `cancelarMinhaAssinatura` chama o provider ANTES de atualizar o banco (senão o
  MP continuaria cobrando).
- **Webhook** (`/api/webhooks/mercadopago`): valida `x-signature` → consulta o
  recurso na API (status real) → atualiza estado. Trata os tópicos
  `subscription_preapproval` (assinatura) e `subscription_authorized_payment`
  (cobrança recorrente → sucesso/falha → dunning). Fail closed em produção se o
  provider for o mock.
- **Estado/gating**: `subscription.ts` (escrita via service_role) + `access.ts`
  (regra de acesso pura e testada) usada no layout `(app)`.

## ⚠️ Checklist OBRIGATÓRIO no sandbox antes de produção

1. **Template do `x-signature`** — confirmar o manifest EXATO. Implementado como:
   `id:{data.id};request-id:{x-request-id};ts:{ts};` com `data.id` do query param
   (minúsculo se alfanumérico), HMAC-SHA256 em hex comparado a `v1`. Validar com
   uma notificação real de teste do painel do MP. **Esta é a parte mais sensível.**
2. **Corpo do `preapproval`** — confirmar campos obrigatórios e formato de
   `auto_recurring` para planos trimestral/anual (frequency 3/12 + months).
3. **Status retornados** — mapear corretamente `authorized`/`paused`/`cancelled`
   (preapproval) e `approved`/`processed`/`rejected` (authorized_payment).
4. **`next_payment_date`** — confirmar que é a fonte do fim do ciclo (periodoFim).
5. **Pix Automático (Pix recorrente)** — DISPONÍVEL no Mercado Pago (confirmado
   pelo cliente). Estratégia: oferecer Pix Automático **e** cartão no checkout
   hospedado (`init_point`), deixando o usuário escolher. No sandbox, validar:
   (a) habilitar Pix Automático na conta MP para ele aparecer no checkout;
   (b) se o `preapproval` precisa de algum campo extra (ex.: `payment_methods`)
   para surfacar o Pix, ou se basta a configuração da conta;
   (c) que a renovação via Pix dispara `subscription_authorized_payment` (o
   webhook já trata). A 1ª autorização do Pix Automático é feita no app do banco.
6. **Idempotência** — `X-Idempotency-Key` já enviado no `criarCheckout`. Garantir
   que reentregas de webhook não dupliquem efeito (ativar = upsert idempotente;
   evitar reextensão de período em reentrega — periodoFim vem do MP, não recalcula).
7. **Credenciais** — usar token de teste (`TEST-...`) + usuários de teste do MP;
   só então trocar por produção. Definir `MERCADOPAGO_WEBHOOK_SECRET` (painel →
   Webhooks) e `PAYMENTS_PROVIDER=mercadopago`.

## Pendências conhecidas (pós-sandbox)
- Reconciliação periódica (GET das assinaturas ativas) como rede de segurança.
- Tratar `paused` (MP pausa por falha de cobrança) além de cancelled/authorized.
- Trocar de plano sem cancelar (upgrade/downgrade).
