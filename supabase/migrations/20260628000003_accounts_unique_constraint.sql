-- =============================================================================
-- Zap Finanças — Corrige a chave de idempotência de accounts (Fase 1)
-- =============================================================================
-- A migration 20260628000002 criou um índice único PARCIAL em
-- (user_id, pluggy_account_id) WHERE pluggy_account_id IS NOT NULL.
--
-- Problema: o PostgreSQL não infere um índice parcial em `ON CONFLICT` sem
-- repetir o predicado WHERE — e nem o PostgREST nem o supabase-js `.upsert()`
-- o fazem. Resultado: upsert de contas falhava com 42P10
-- ("no unique or exclusion constraint matching the ON CONFLICT specification").
--
-- Correção: substituir por uma UNIQUE CONSTRAINT normal. No Postgres, valores
-- NULL são distintos numa constraint única, então contas manuais (sem
-- pluggy_account_id) continuam permitidas sem colidir entre si.
-- =============================================================================

drop index if exists public.accounts_user_pluggy_account_uidx;

alter table public.accounts
  drop constraint if exists accounts_user_pluggy_account_key,
  add constraint accounts_user_pluggy_account_key
    unique (user_id, pluggy_account_id);
