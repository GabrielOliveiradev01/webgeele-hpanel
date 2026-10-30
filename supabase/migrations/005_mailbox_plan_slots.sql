-- Slots por plano de caixa (start/business/professional) + armazenamento agregado
alter table public.accounts
  add column if not exists mailbox_slots jsonb not null default '{}'::jsonb,
  add column if not exists extra_storage_mb integer not null default 0;
