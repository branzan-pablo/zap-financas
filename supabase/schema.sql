-- Waitlist table for the demand-validation smoke test (Fase 2.5).
-- Run this in the Supabase SQL editor.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  wants_founder boolean not null default false,
  price_shown text,
  source text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- One row per email (dedupe). The API treats a duplicate as success.
create unique index if not exists waitlist_email_key
  on public.waitlist (lower(email));

-- RLS on: only the service role (server-side) can read/write.
-- The landing API uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS,
-- so no public policy is added on purpose. Leads stay private.
alter table public.waitlist enable row level security;
