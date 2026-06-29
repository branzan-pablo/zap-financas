-- =============================================================================
-- Zap Finanças — Idempotência para cartões, parcelas e investimentos (Fase 1E)
-- =============================================================================
-- O sync agora também faz upsert de cards, installments e investments.
-- Cada um precisa de uma chave de conflito ÚNICA e NÃO-PARCIAL (índices
-- parciais não funcionam com ON CONFLICT via PostgREST/supabase-js — ver
-- migration 20260628000003).
--
-- Em todos os casos a coluna de conflito aceita NULL (cartões/parcelas/
-- investimentos manuais), e NULLs são distintos em UNIQUE no Postgres, então
-- registros manuais não colidem entre si.
-- =============================================================================

-- cards: ganha a referência ao cartão no provider (Pluggy/mock) + unicidade.
alter table public.cards
  add column if not exists pluggy_card_id text;

alter table public.cards
  drop constraint if exists cards_pluggy_card_id_key,
  add constraint cards_pluggy_card_id_key unique (pluggy_card_id);

-- installments: uma parcela por transação de origem.
alter table public.installments
  drop constraint if exists installments_transaction_id_key,
  add constraint installments_transaction_id_key unique (transaction_id);

-- investments: uma posição por id do provider.
alter table public.investments
  drop constraint if exists investments_pluggy_inv_id_key,
  add constraint investments_pluggy_inv_id_key unique (pluggy_inv_id);
