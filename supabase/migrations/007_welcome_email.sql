-- Marca quando o e-mail de boas-vindas foi enviado, para mandar uma única vez.
alter table public.accounts
  add column if not exists welcome_email_sent_at timestamptz;

-- Contas que já existiam não recebem boas-vindas atrasadas.
update public.accounts
  set welcome_email_sent_at = created_at
  where welcome_email_sent_at is null;
