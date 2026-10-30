-- WebGeele hPanel — schema no projeto mrhdexptnwlrcmiwpycm
-- 1 conta = 1 usuário (sem acesso compartilhado)
-- Caixas (Stalwart) e permissões seguem o plano; assinatura Assas controla o bloqueio

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Planos e permissões
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price_cents integer not null default 0,
  currency text not null default 'BRL',
  asaas_product_id text,
  max_mailboxes integer not null default 1,
  max_domains integer not null default 1,
  max_storage_mb integer not null default 1024,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Conta do cliente (um único dono / auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users (id) on delete cascade,
  legal_name text,
  trade_name text,
  document text,
  email text not null,
  phone text,
  status text not null default 'active'
    check (status in ('active', 'past_due', 'blocked', 'canceled')),
  asaas_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accounts_owner_user_id_idx on public.accounts (owner_user_id);
create index if not exists accounts_status_idx on public.accounts (status);

-- ---------------------------------------------------------------------------
-- Assinaturas Assas
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  asaas_subscription_id text unique,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'past_due', 'canceled', 'expired', 'blocked')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_account_id_idx on public.subscriptions (account_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

-- ---------------------------------------------------------------------------
-- Domínios
-- ---------------------------------------------------------------------------
create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'expired', 'transferred')),
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, name)
);

create index if not exists domains_account_id_idx on public.domains (account_id);

-- ---------------------------------------------------------------------------
-- Caixas Stalwart (cota = plan.max_mailboxes; bloqueio se assinatura inválida)
-- ---------------------------------------------------------------------------
create table if not exists public.mailboxes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  local_part text not null,
  email text not null,
  stalwart_account_id text,
  status text not null default 'provisioning'
    check (status in ('provisioning', 'active', 'blocked', 'deleted', 'error')),
  blocked_reason text,
  quota_mb integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, email)
);

create index if not exists mailboxes_account_id_idx on public.mailboxes (account_id);
create index if not exists mailboxes_status_idx on public.mailboxes (status);

-- ---------------------------------------------------------------------------
-- Eventos Assas / auditoria leve
-- ---------------------------------------------------------------------------
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts (id) on delete set null,
  event_type text not null,
  asaas_event_id text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists billing_events_account_id_idx on public.billing_events (account_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists domains_set_updated_at on public.domains;
create trigger domains_set_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();

drop trigger if exists mailboxes_set_updated_at on public.mailboxes;
create trigger mailboxes_set_updated_at
  before update on public.mailboxes
  for each row execute function public.set_updated_at();

-- Conta do usuário autenticado (single owner)
create or replace function public.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.accounts where owner_user_id = auth.uid() limit 1;
$$;

create or replace function public.account_is_entitled(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.accounts a
    join public.subscriptions s on s.account_id = a.id
    where a.id = p_account_id
      and a.status = 'active'
      and s.status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS — somente o dono da conta
-- ---------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.accounts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.domains enable row level security;
alter table public.mailboxes enable row level security;
alter table public.billing_events enable row level security;

drop policy if exists plans_read_active on public.plans;
create policy plans_read_active on public.plans
  for select to authenticated
  using (is_active = true);

drop policy if exists accounts_owner_all on public.accounts;
create policy accounts_owner_all on public.accounts
  for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists subscriptions_owner_select on public.subscriptions;
create policy subscriptions_owner_select on public.subscriptions
  for select to authenticated
  using (account_id = public.current_account_id());

drop policy if exists domains_owner_all on public.domains;
create policy domains_owner_all on public.domains
  for all to authenticated
  using (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());

drop policy if exists mailboxes_owner_all on public.mailboxes;
create policy mailboxes_owner_all on public.mailboxes
  for all to authenticated
  using (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());

drop policy if exists billing_events_owner_select on public.billing_events;
create policy billing_events_owner_select on public.billing_events
  for select to authenticated
  using (account_id = public.current_account_id());

-- ---------------------------------------------------------------------------
-- Planos iniciais
-- ---------------------------------------------------------------------------
insert into public.plans (code, name, description, price_cents, max_mailboxes, max_domains, max_storage_mb, features)
values
  (
    'starter',
    'Starter',
    'Plano inicial com caixas Stalwart limitadas',
    4990,
    2,
    1,
    2048,
    '{"dns": true, "support": "email"}'::jsonb
  ),
  (
    'business',
    'Business',
    'Plano intermediário para empresas',
    18990,
    10,
    5,
    20480,
    '{"dns": true, "support": "priority"}'::jsonb
  ),
  (
    'enterprise',
    'Enterprise',
    'Plano avançado com maior cota de caixas',
    49990,
    50,
    20,
    102400,
    '{"dns": true, "support": "dedicated"}'::jsonb
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  max_mailboxes = excluded.max_mailboxes,
  max_domains = excluded.max_domains,
  max_storage_mb = excluded.max_storage_mb,
  features = excluded.features,
  updated_at = now();
