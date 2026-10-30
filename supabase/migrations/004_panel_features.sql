-- Recursos do painel: cotas extras, DNS, pedidos Assas, suporte

alter table public.accounts
  add column if not exists extra_mailboxes integer not null default 0,
  add column if not exists document text,
  add column if not exists phone text;

alter table public.domains
  add column if not exists source text not null default 'external'
    check (source in ('registered', 'transferred', 'external')),
  add column if not exists auth_code text,
  add column if not exists nameservers text[] not null default '{}',
  add column if not exists notes text;

create table if not exists public.dns_records (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  domain_id uuid not null references public.domains (id) on delete cascade,
  type text not null check (type in ('A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV')),
  name text not null,
  value text not null,
  ttl integer not null default 3600,
  priority integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dns_records_domain_id_idx on public.dns_records (domain_id);
create index if not exists dns_records_account_id_idx on public.dns_records (account_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  type text not null check (type in ('extra_mailbox', 'domain_register', 'domain_transfer')),
  quantity integer not null default 1,
  unit_price_cents integer not null default 0,
  amount_cents integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'canceled', 'expired')),
  asaas_payment_id text unique,
  invoice_url text,
  bank_slip_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_account_id_idx on public.orders (account_id);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'answered', 'closed')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_account_id_idx on public.support_tickets (account_id);

drop trigger if exists dns_records_set_updated_at on public.dns_records;
create trigger dns_records_set_updated_at
  before update on public.dns_records
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

alter table public.dns_records enable row level security;
alter table public.orders enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists dns_records_owner_all on public.dns_records;
create policy dns_records_owner_all on public.dns_records
  for all to authenticated
  using (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());

drop policy if exists orders_owner_select on public.orders;
create policy orders_owner_select on public.orders
  for select to authenticated
  using (account_id = public.current_account_id());

drop policy if exists support_tickets_owner_all on public.support_tickets;
create policy support_tickets_owner_all on public.support_tickets
  for all to authenticated
  using (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());

-- Preço padrão de caixa extra (pode ajustar depois)
insert into public.plans (code, name, description, price_cents, max_mailboxes, max_domains, max_storage_mb, features)
values (
  'mailbox_addon',
  'Caixa de entrada extra',
  'Slot adicional de caixa Stalwart',
  990,
  1,
  0,
  2048,
  '{"addon": true}'::jsonb
)
on conflict (code) do update set
  price_cents = excluded.price_cents,
  description = excluded.description,
  updated_at = now();
