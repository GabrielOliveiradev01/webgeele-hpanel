-- Controle por caixa: bloquear envio/recebimento, bloquear acesso, pausar e admin do domínio.

alter table public.mailboxes
  add column if not exists mail_blocked boolean not null default false,
  add column if not exists access_blocked boolean not null default false,
  add column if not exists access_paused boolean not null default false,
  add column if not exists is_domain_admin boolean not null default false;

create unique index if not exists mailboxes_one_domain_admin
  on public.mailboxes (domain_id)
  where is_domain_admin and status <> 'deleted';

-- A caixa mais antiga de cada domínio vira administrador, se ainda não houver um.
with first_mailbox as (
  select distinct on (domain_id) id
  from public.mailboxes
  where status <> 'deleted'
    and domain_id is not null
  order by domain_id, created_at asc
)
update public.mailboxes as mailbox
set is_domain_admin = true
from first_mailbox
where mailbox.id = first_mailbox.id
  and not exists (
    select 1
    from public.mailboxes as other
    where other.domain_id = mailbox.domain_id
      and other.is_domain_admin
      and other.status <> 'deleted'
  );
