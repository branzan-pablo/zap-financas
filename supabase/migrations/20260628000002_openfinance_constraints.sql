-- =============================================================================
-- Zap Finanças — Constraints de idempotência para o sync Open Finance (Fase 1)
-- =============================================================================
-- O pipeline de sync (src/lib/openfinance/sync.ts) faz upsert de contas e
-- transações. transactions.pluggy_tx_id já é UNIQUE no schema base; falta a
-- chave de conflito para contas: uma conta é única por (usuário, conta Pluggy).
--
-- Índice parcial: só vale quando pluggy_account_id não é nulo (contas manuais
-- futuras não colidem entre si).
-- =============================================================================

create unique index if not exists accounts_user_pluggy_account_uidx
  on public.accounts (user_id, pluggy_account_id)
  where pluggy_account_id is not null;
