-- Migração de e-mails (WebGeele Transfer Worker)
-- Cada linha é um teste de conexão (kind = 'check') ou uma cópia (kind = 'sync').
-- NUNCA guarda senhas: elas vão do navegador ao backend e do backend ao Worker,
-- e só existem em memória durante o pedido.

create table if not exists public.mail_migrations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  mailbox_id uuid references public.mailboxes (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  kind text not null check (kind in ('check', 'sync')),
  provider text not null,
  source_host text not null,
  source_email text not null,
  destination_email text not null,
  -- Id da tarefa no Worker; nunca é enviado ao navegador.
  worker_job_id text unique,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  -- Snapshot do progresso informado pelo imapsync (pastas, mensagens, percentual).
  progress jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  exit_code integer,
  started_at timestamptz,
  finished_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mail_migrations_account_created_idx
  on public.mail_migrations (account_id, created_at desc);

create index if not exists mail_migrations_mailbox_id_idx
  on public.mail_migrations (mailbox_id);

-- No máximo uma cópia ativa por caixa de destino.
create unique index if not exists mail_migrations_one_active_sync_per_mailbox
  on public.mail_migrations (mailbox_id)
  where kind = 'sync' and status in ('pending', 'running');

drop trigger if exists mail_migrations_set_updated_at on public.mail_migrations;
create trigger mail_migrations_set_updated_at
  before update on public.mail_migrations
  for each row execute function public.set_updated_at();

-- RLS: o cliente só pode LER as próprias migrações. Criação e atualização são
-- feitas apenas pelo backend (service role), que valida a conta em cada pedido.
alter table public.mail_migrations enable row level security;

drop policy if exists mail_migrations_owner_select on public.mail_migrations;
create policy mail_migrations_owner_select on public.mail_migrations
  for select to authenticated
  using (account_id = public.current_account_id());
