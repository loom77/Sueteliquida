-- Jornadas oficiales de La Quiniela y El Quinigol.
-- La tabla principal conserva el snapshot vigente; la tabla de revisiones
-- mantiene cada composición oficial distinta identificada por source_hash.
create table if not exists public.primy_sports_rounds (
  round_id text primary key,
  game_id text not null check (game_id in ('quiniela', 'quinigol')),
  season text,
  official_round_number text,
  round_date date,
  status text not null check (status in ('draft','published','sales-open','sales-closed','in-progress','provisional','official','cancelled')),
  sales_open_at timestamptz,
  sales_close_at timestamptz,
  source text not null default 'SELAE oficial',
  source_url text,
  source_hash text,
  official_updated_at timestamptz,
  fetched_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0),
  matches jsonb not null default '[]'::jsonb check (jsonb_typeof(matches) = 'array'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists primy_sports_rounds_latest_idx
  on public.primy_sports_rounds (game_id, round_date desc nulls last, updated_at desc);
create index if not exists primy_sports_rounds_status_idx
  on public.primy_sports_rounds (game_id, status, sales_close_at desc nulls last);

create table if not exists public.primy_sports_round_revisions (
  round_id text not null references public.primy_sports_rounds(round_id) on delete cascade,
  source_hash text not null,
  game_id text not null check (game_id in ('quiniela', 'quinigol')),
  status text not null,
  fetched_at timestamptz not null default now(),
  matches jsonb not null check (jsonb_typeof(matches) = 'array'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  primary key (round_id, source_hash)
);

alter table public.primy_sports_rounds enable row level security;
alter table public.primy_sports_round_revisions enable row level security;

grant select on public.primy_sports_rounds to anon, authenticated;
grant all on public.primy_sports_rounds to service_role;
grant all on public.primy_sports_round_revisions to service_role;
revoke all on public.primy_sports_round_revisions from anon, authenticated;

drop policy if exists "primy_sports_rounds_public_read" on public.primy_sports_rounds;
create policy "primy_sports_rounds_public_read"
on public.primy_sports_rounds for select to anon, authenticated using (true);

drop trigger if exists primy_sports_rounds_updated_at on public.primy_sports_rounds;
create trigger primy_sports_rounds_updated_at
before update on public.primy_sports_rounds
for each row execute function public.primy_set_updated_at();
