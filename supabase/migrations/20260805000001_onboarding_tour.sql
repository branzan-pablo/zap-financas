-- =============================================================================
-- Zap Finanças — Tour de onboarding (Fase 6)
-- =============================================================================
-- Marca quando a pessoa concluiu (ou pulou) a apresentação do app, para que ela
-- não reapareça a cada acesso. Mesmo padrão de `lgpd_consent_at`: uma coluna de
-- timestamp em profiles, NULL = ainda não viu.
--
-- Sem backfill de propósito: usuários existentes veem o tour uma vez, já que é
-- um recurso novo e o produto ainda não foi lançado.
-- =============================================================================

alter table public.profiles
  add column if not exists onboarding_done_at timestamptz;

comment on column public.profiles.onboarding_done_at is
  'Quando o tour de onboarding foi concluído ou pulado. NULL = nunca viu.';
