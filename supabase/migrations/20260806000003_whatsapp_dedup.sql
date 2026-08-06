-- =============================================================================
-- Zap Finanças — Idempotência do webhook inbound de WhatsApp
-- =============================================================================
-- PROBLEMA
--   A Evolution API reentrega mensagens quando não recebe ack a tempo (timeout,
--   deploy no meio do processamento, retry interno). O webhook não guardava
--   nenhuma marca do que já tinha processado, então uma reentrega de
--   "gastei 50 no mercado" registrava o gasto DUAS vezes.
--
--   Os outros dois webhooks já são idempotentes por construção: o do Pluggy
--   re-consulta a API e faz upsert por chave única; o do Mercado Pago resolve o
--   estado atual da assinatura. Só o do WhatsApp escrevia às cegas.
--
-- CORREÇÃO
--   Registrar cada messageId processado. O INSERT vem ANTES do processamento e
--   a PK faz o trabalho de trava: numa reentrega (ou em duas entregas
--   simultâneas) o segundo INSERT falha com 23505 e o webhook devolve ack sem
--   reprocessar. Fica atômico sem precisar de lock explícito.
--
-- ACESSO
--   RLS ligado e ZERO policies: a tabela só é alcançável pelo service_role, que
--   é o que o webhook usa (createAdminClient). Mesmo padrão de `waitlist`.
-- =============================================================================

create table if not exists public.whatsapp_processed (
  message_id   text primary key,
  processed_at timestamptz not null default now()
);

comment on table public.whatsapp_processed is
  'messageIds já processados pelo webhook inbound — evita registrar o mesmo gasto duas vezes numa reentrega.';

-- Suporte à limpeza periódica (a tabela só precisa da janela de retry).
create index if not exists whatsapp_processed_at_idx
  on public.whatsapp_processed (processed_at);

alter table public.whatsapp_processed enable row level security;
