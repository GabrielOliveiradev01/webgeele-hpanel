-- Conta do painel só após confirmação de e-mail

create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
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
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_email_confirmed();
