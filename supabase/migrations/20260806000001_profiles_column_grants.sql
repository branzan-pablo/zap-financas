-- =============================================================================
-- Zap Finanças — Trava as colunas de billing em `profiles` (correção de segurança)
-- =============================================================================
-- PROBLEMA
--   A policy "profiles: atualização própria" permite ao usuário dar UPDATE na
--   própria linha — em QUALQUER coluna. E o gating de acesso pago
--   (src/app/(app)/layout.tsx) decide pelo `trial_ends_at` dessa mesma linha.
--
--   Como a anon key é pública (vai no bundle do browser), qualquer usuário
--   logado conseguia:
--
--     PATCH /rest/v1/profiles?id=eq.<seu-uid>
--     {"trial_ends_at": "2099-01-01", "plano": "pago"}
--
--   → trial infinito, de graça. Bypass total da monetização.
--
-- CORREÇÃO
--   RLS é por LINHA, não por coluna — a policy não resolve isso. O controle por
--   coluna no Postgres é via GRANT, que o PostgREST respeita (devolve 403 ao
--   tentar escrever numa coluna não concedida).
--
--   Concedemos UPDATE apenas nas colunas que são de fato do usuário. As colunas
--   de billing/consentimento (plano, trial_ends_at, lgpd_consent_at) e as de
--   controle (id, created_at, updated_at) ficam de fora — só o service_role
--   escreve nelas, via webhook de pagamento, cron de dunning e o trigger
--   handle_new_user (SECURITY DEFINER, não afetado por estes grants).
--
--   A policy de RLS continua valendo: o usuário só alcança a PRÓPRIA linha.
--   Os dois mecanismos se somam — linha pela policy, coluna pelo grant.
-- =============================================================================

revoke update on public.profiles from authenticated;

-- Colunas que o usuário pode editar sobre si mesmo.
--   • nome, avatar_url, telefone  → dados de perfil
--   • onboarding_done_at          → escrito por concluirTour() com o client RLS
--                                   do próprio usuário (src/app/(app)/tour-actions.ts)
grant update (nome, avatar_url, telefone, onboarding_done_at)
  on public.profiles to authenticated;
