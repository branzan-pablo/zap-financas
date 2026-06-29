-- =============================================================================
-- Zap Finanças — Consentimento LGPD (Fase 5)
-- =============================================================================
-- Registra o momento do consentimento (opt-in ativo no cadastro). O valor é
-- semeado pelo trigger handle_new_user a partir do metadata do signup.
-- =============================================================================

alter table public.profiles
  add column if not exists lgpd_consent_at timestamptz;

-- Atualiza o trigger para gravar o consentimento quando informado no signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, avatar_url, trial_ends_at, lgpd_consent_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    now() + interval '14 days',
    case when new.raw_user_meta_data->>'lgpd_consent' = 'true' then now() else null end
  );
  return new;
end;
$$;
