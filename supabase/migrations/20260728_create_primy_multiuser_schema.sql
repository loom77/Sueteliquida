create table if not exists public.primy_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.primy_plays (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.primy_user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.primy_data_migrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  local_storage_imported boolean not null default false,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists primy_plays_user_updated_idx on public.primy_plays (user_id, updated_at desc);

create or replace function public.primy_set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists primy_profiles_updated_at on public.primy_profiles;
create trigger primy_profiles_updated_at before update on public.primy_profiles for each row execute function public.primy_set_updated_at();
drop trigger if exists primy_plays_updated_at on public.primy_plays;
create trigger primy_plays_updated_at before update on public.primy_plays for each row execute function public.primy_set_updated_at();
drop trigger if exists primy_user_settings_updated_at on public.primy_user_settings;
create trigger primy_user_settings_updated_at before update on public.primy_user_settings for each row execute function public.primy_set_updated_at();
drop trigger if exists primy_data_migrations_updated_at on public.primy_data_migrations;
create trigger primy_data_migrations_updated_at before update on public.primy_data_migrations for each row execute function public.primy_set_updated_at();

alter table public.primy_profiles enable row level security;
alter table public.primy_plays enable row level security;
alter table public.primy_user_settings enable row level security;
alter table public.primy_data_migrations enable row level security;

create policy "primy_profiles_select_own" on public.primy_profiles for select to authenticated using (auth.uid() = id);
create policy "primy_profiles_insert_own" on public.primy_profiles for insert to authenticated with check (auth.uid() = id);
create policy "primy_profiles_update_own" on public.primy_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "primy_plays_select_own" on public.primy_plays for select to authenticated using (auth.uid() = user_id);
create policy "primy_plays_insert_own" on public.primy_plays for insert to authenticated with check (auth.uid() = user_id);
create policy "primy_plays_update_own" on public.primy_plays for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "primy_plays_delete_own" on public.primy_plays for delete to authenticated using (auth.uid() = user_id);
create policy "primy_settings_select_own" on public.primy_user_settings for select to authenticated using (auth.uid() = user_id);
create policy "primy_settings_insert_own" on public.primy_user_settings for insert to authenticated with check (auth.uid() = user_id);
create policy "primy_settings_update_own" on public.primy_user_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "primy_migrations_select_own" on public.primy_data_migrations for select to authenticated using (auth.uid() = user_id);
create policy "primy_migrations_insert_own" on public.primy_data_migrations for insert to authenticated with check (auth.uid() = user_id);
create policy "primy_migrations_update_own" on public.primy_data_migrations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on public.primy_profiles, public.primy_plays, public.primy_user_settings, public.primy_data_migrations from anon;
grant select, insert, update on public.primy_profiles to authenticated;
grant select, insert, update, delete on public.primy_plays to authenticated;
grant select, insert, update on public.primy_user_settings to authenticated;
grant select, insert, update on public.primy_data_migrations to authenticated;
