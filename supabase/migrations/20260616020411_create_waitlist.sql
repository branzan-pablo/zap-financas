-- Waitlist for the demand-validation smoke test (Fase 2.5).
-- Access model: writes happen ONLY server-side via the service_role key
-- (Next.js Route Handler). RLS is enabled with NO policies, so the table is
-- not reachable by the anon/authenticated roles through the Data API.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  wants_founder boolean not null default false,
  price_shown text,
  source text,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.waitlist is 'Leads captured by the landing smoke test (Fase 2.5).';
comment on column public.waitlist.wants_founder is 'True when the lead came through the founder-price fake-door (willingness-to-pay signal).';
comment on column public.waitlist.price_shown is 'Price label displayed at capture time.';
comment on column public.waitlist.source is 'Acquisition source (e.g. UTM query string).';

-- One row per email. The API treats a unique violation (23505) as success.
create unique index if not exists waitlist_email_key
  on public.waitlist (lower(email));

-- Useful for funnel analysis (founder conversion over time).
create index if not exists waitlist_created_at_idx
  on public.waitlist (created_at desc);

-- RLS on, no policies: locks the table to the service_role only.
alter table public.waitlist enable row level security;
