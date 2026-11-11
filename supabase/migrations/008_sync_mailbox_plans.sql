-- Planos de caixa no mesmo valor e armazenamento do painel.
insert into public.plans (
  code, name, description, price_cents, max_mailboxes, max_domains, max_storage_mb, features
)
values
  (
    'mailbox_start',
    'Start',
    'Caixa Start com 2 GB',
    990,
    1,
    0,
    2048,
    '{"addon": true, "annual_cents": 5880}'::jsonb
  ),
  (
    'mailbox_business',
    'Business',
    'Caixa Business com 5 GB',
    1490,
    1,
    0,
    5120,
    '{"addon": true, "annual_cents": 9480}'::jsonb
  ),
  (
    'mailbox_professional',
    'Business Plus',
    'Caixa Business Plus com 10 GB',
    2490,
    1,
    0,
    10240,
    '{"addon": true, "annual_cents": 14280}'::jsonb
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  max_mailboxes = excluded.max_mailboxes,
  max_storage_mb = excluded.max_storage_mb,
  features = excluded.features,
  updated_at = now();
