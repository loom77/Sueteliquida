-- Primy v16.2.0 — persist the registration name in public.primy_profiles.
create or replace function public.primy_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.primy_profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.primy_profiles.display_name, excluded.display_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_primy_profile on auth.users;
create trigger on_auth_user_created_primy_profile
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.primy_handle_new_user();
