-- Cria a conta do painel automaticamente quando o usuário confirma o cadastro.
-- Regra: 1 auth.users = 1 accounts (owner_user_id unique)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'legal_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  insert into public.accounts (
    owner_user_id,
    email,
    legal_name,
    trade_name,
    status
  )
  values (
    new.id,
    new.email,
    v_name,
    v_name,
    'active'
  )
  on conflict (owner_user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
