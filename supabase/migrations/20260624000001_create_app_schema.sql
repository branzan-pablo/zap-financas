-- =============================================================================
-- Zap Finanças — App Schema (Fase 0 + estrutura para Fases 1-4)
-- =============================================================================
-- Princípios:
--   • RLS habilitado em TODAS as tabelas; acesso apenas via service_role
--     no servidor (Next.js Route Handlers / Server Functions / Edge Functions).
--   • Cálculos financeiros nunca no cliente.
--   • Timestamps em UTC; datas de referência em 'date' sem fuso.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PROFILES
-- Estende auth.users com dados do produto.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  nome           text,
  telefone       text,                          -- E.164 p/ vínculo WhatsApp
  avatar_url     text,
  plano          text not null default 'trial', -- 'trial' | 'pago' | 'gratuito'
  trial_ends_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de usuário — extensão de auth.users.';

alter table public.profiles enable row level security;

create policy "profiles: leitura própria"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: atualização própria"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Trigger: cria perfil automaticamente ao signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, avatar_url, trial_ends_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    now() + interval '14 days'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- CATEGORIES
-- Categorias globais (user_id IS NULL) + categorias do usuário.
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade, -- null = global
  nome         text not null,
  icone        text,             -- emoji ou slug de ícone
  cor          text,             -- hex
  tipo         text not null default 'despesa', -- 'despesa' | 'receita' | 'transferencia'
  regras       jsonb,            -- array de strings p/ matching automático
  created_at   timestamptz not null default now()
);

comment on table public.categories is 'Categorias de transação. user_id NULL = global (seed).';
comment on column public.categories.regras is 'Palavras/regex para matching automático de descrição.';

alter table public.categories enable row level security;

create policy "categories: ver globais e próprias"
  on public.categories for select
  using (user_id is null or user_id = auth.uid());

create policy "categories: inserir próprias"
  on public.categories for insert
  with check (user_id = auth.uid());

create policy "categories: atualizar próprias"
  on public.categories for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "categories: deletar próprias"
  on public.categories for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ACCOUNTS
-- Contas bancárias/de investimento conectadas via Pluggy.
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  nome              text not null,
  banco             text,                   -- nome da instituição
  tipo              text not null,          -- 'corrente' | 'poupanca' | 'cartao' | 'investimento' | 'outro'
  saldo             numeric(15,2),
  moeda             text not null default 'BRL',
  pluggy_item_id    text,                   -- ID do item Pluggy (conexão Open Finance)
  pluggy_account_id text,                   -- ID da conta dentro do item
  ativo             boolean not null default true,
  ultimo_sync       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.accounts is 'Contas bancárias e de investimento do usuário.';

alter table public.accounts enable row level security;

create policy "accounts: acesso próprio"
  on public.accounts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists accounts_pluggy_item_idx on public.accounts(pluggy_item_id) where pluggy_item_id is not null;

-- ---------------------------------------------------------------------------
-- TRANSACTIONS
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  account_id       uuid not null references public.accounts(id) on delete cascade,
  category_id      uuid references public.categories(id) on delete set null,
  valor            numeric(15,2) not null,   -- positivo = crédito, negativo = débito
  descricao        text not null,
  data             date not null,
  tipo             text not null default 'debito', -- 'debito' | 'credito' | 'transferencia'
  pluggy_tx_id     text unique,             -- evita duplicatas no sync
  origem           text not null default 'manual', -- 'manual' | 'openfinance' | 'whatsapp' | 'import'
  notas            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.transactions is 'Transações financeiras do usuário.';

alter table public.transactions enable row level security;

create policy "transactions: acesso próprio"
  on public.transactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists transactions_user_date_idx   on public.transactions(user_id, data desc);
create index if not exists transactions_account_idx     on public.transactions(account_id);
create index if not exists transactions_category_idx    on public.transactions(category_id);
create index if not exists transactions_pluggy_tx_idx   on public.transactions(pluggy_tx_id) where pluggy_tx_id is not null;

-- ---------------------------------------------------------------------------
-- CARDS
-- Cartões de crédito (podem ou não estar linkados a uma conta Open Finance).
-- ---------------------------------------------------------------------------
create table if not exists public.cards (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  account_id       uuid references public.accounts(id) on delete set null,
  nome             text not null,
  bandeira         text,                    -- 'visa' | 'mastercard' | 'elo' | ...
  limite           numeric(15,2),
  dia_fechamento   smallint check (dia_fechamento between 1 and 31),
  dia_vencimento   smallint check (dia_vencimento between 1 and 31),
  ativo            boolean not null default true,
  created_at       timestamptz not null default now()
);

comment on table public.cards is 'Cartões de crédito do usuário.';

alter table public.cards enable row level security;

create policy "cards: acesso próprio"
  on public.cards for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists cards_user_id_idx on public.cards(user_id);

-- ---------------------------------------------------------------------------
-- INSTALLMENTS
-- Compras parceladas — cada registro = 1 parcela de 1 compra.
-- ---------------------------------------------------------------------------
create table if not exists public.installments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  card_id          uuid references public.cards(id) on delete set null,
  transaction_id   uuid references public.transactions(id) on delete set null,
  descricao        text not null,
  valor_parcela    numeric(15,2) not null,
  total_parcelas   smallint not null,
  parcela_atual    smallint not null,
  primeira_parcela date not null,           -- data da 1ª parcela (base p/ projeção)
  created_at       timestamptz not null default now()
);

comment on table public.installments is 'Compras parceladas — projeta comprometimento futuro.';
comment on column public.installments.primeira_parcela is 'Data da 1ª parcela; demais = +N meses.';

alter table public.installments enable row level security;

create policy "installments: acesso próprio"
  on public.installments for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists installments_user_id_idx   on public.installments(user_id);
create index if not exists installments_card_id_idx   on public.installments(card_id);

-- ---------------------------------------------------------------------------
-- BUDGETS
-- Orçamentos mensais por categoria.
-- ---------------------------------------------------------------------------
create table if not exists public.budgets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete cascade,
  limite          numeric(15,2) not null,
  mes_referencia  date not null,            -- sempre dia 1 do mês: 2026-07-01
  created_at      timestamptz not null default now(),
  unique (user_id, category_id, mes_referencia)
);

comment on table public.budgets is 'Orçamentos mensais por categoria.';

alter table public.budgets enable row level security;

create policy "budgets: acesso próprio"
  on public.budgets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists budgets_user_mes_idx on public.budgets(user_id, mes_referencia desc);

-- ---------------------------------------------------------------------------
-- GOALS
-- Metas financeiras (fundo de emergência, viagem, etc.).
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  nome          text not null,
  descricao     text,
  valor_alvo    numeric(15,2) not null,
  valor_atual   numeric(15,2) not null default 0,
  data_alvo     date,
  concluida     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.goals is 'Metas financeiras do usuário.';

alter table public.goals enable row level security;

create policy "goals: acesso próprio"
  on public.goals for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- INVESTMENTS
-- Posições de investimento (sync via Pluggy ou manual).
-- ---------------------------------------------------------------------------
create table if not exists public.investments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  account_id        uuid references public.accounts(id) on delete set null,
  nome              text not null,
  tipo              text not null,           -- 'cdb' | 'lci' | 'lca' | 'tesouro' | 'fundo' | 'acao' | 'cripto' | 'outro'
  valor_aplicado    numeric(15,2),
  valor_atual       numeric(15,2),
  rendimento_pct    numeric(8,4),            -- rendimento acumulado em %
  data_aplicacao    date,
  data_vencimento   date,
  pluggy_inv_id     text,
  ultimo_sync       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.investments is 'Posições de investimento do usuário.';

alter table public.investments enable row level security;

create policy "investments: acesso próprio"
  on public.investments for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists investments_user_id_idx on public.investments(user_id);

-- ---------------------------------------------------------------------------
-- SUBSCRIPTIONS
-- Plano e estado de assinatura (Mercado Pago).
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  plano               text not null default 'trial', -- 'trial' | 'mensal' | 'trimestral' | 'anual' | 'cancelado'
  status              text not null default 'ativo',  -- 'ativo' | 'inadimplente' | 'cancelado' | 'expirado'
  mp_subscription_id  text unique,                    -- ID da assinatura no Mercado Pago
  mp_payer_id         text,
  periodo_inicio      timestamptz,
  periodo_fim         timestamptz,
  trial_ends_at       timestamptz,
  cancelado_em        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.subscriptions is 'Assinaturas e planos dos usuários.';

alter table public.subscriptions enable row level security;

create policy "subscriptions: leitura própria"
  on public.subscriptions for select
  using (user_id = auth.uid());

-- Apenas service_role pode escrever (via webhook Mercado Pago).
-- Nenhuma policy de write para authenticated role.

-- ---------------------------------------------------------------------------
-- ALERTS
-- Alertas agendados (WhatsApp, email, in-app).
-- ---------------------------------------------------------------------------
create table if not exists public.alerts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  tipo            text not null,    -- 'budget_warning' | 'card_closing' | 'installment_due' | 'custom'
  canal           text not null default 'whatsapp', -- 'whatsapp' | 'email' | 'inapp'
  mensagem        text,
  agendado_para   timestamptz,
  enviado_em      timestamptz,
  lido_em         timestamptz,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

comment on table public.alerts is 'Alertas e notificações dos usuários.';

alter table public.alerts enable row level security;

create policy "alerts: acesso próprio"
  on public.alerts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists alerts_user_scheduled_idx on public.alerts(user_id, agendado_para) where enviado_em is null;

-- ---------------------------------------------------------------------------
-- WHATSAPP_LINKS
-- Vínculo telefone ↔ usuário para a integração com Evolution API.
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_links (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  telefone      text not null,       -- E.164: +5511999999999
  status        text not null default 'pendente', -- 'pendente' | 'ativo' | 'inativo'
  codigo_pareamento text,            -- código temporário de verificação
  codigo_expira_em  timestamptz,
  paired_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (telefone)                  -- 1 telefone por conta
);

comment on table public.whatsapp_links is 'Vínculo entre número de WhatsApp e usuário.';

alter table public.whatsapp_links enable row level security;

create policy "whatsapp_links: acesso próprio"
  on public.whatsapp_links for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_accounts
  before update on public.accounts
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_transactions
  before update on public.transactions
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_goals
  before update on public.goals
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_investments
  before update on public.investments
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_subscriptions
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_whatsapp_links
  before update on public.whatsapp_links
  for each row execute procedure public.set_updated_at();
