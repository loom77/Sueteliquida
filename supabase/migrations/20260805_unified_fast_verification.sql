-- Primy v16.9 — Unified Fast Verification
-- Unifica resultados numéricos, deportivos e hípicos en un único feed
-- optimizado para comprobación inmediata y Realtime.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- Prerequisites that may not yet exist in older production databases.
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

create table if not exists public.primy_horse_rounds (
  round_id text primary key,
  game_id text not null check (game_id in ('lototurf', 'quintuple-plus')),
  season text,
  official_round_number text,
  round_date date,
  status text not null check (status in ('draft','document-published','sales-open','sales-closed','in-progress','provisional','official','cancelled')),
  sales_open_at timestamptz,
  sales_close_at timestamptz,
  source text not null default 'SELAE oficial',
  source_url text,
  program_url text,
  withdrawals_url text,
  result_url text,
  source_hash text,
  official_updated_at timestamptz,
  fetched_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0),
  venue text,
  races jsonb not null default '[]'::jsonb check (jsonb_typeof(races) = 'array'),
  result jsonb check (result is null or jsonb_typeof(result) = 'object'),
  documents jsonb not null default '[]'::jsonb check (jsonb_typeof(documents) = 'array'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.primy_horse_round_revisions (
  round_id text not null references public.primy_horse_rounds(round_id) on delete cascade,
  source_hash text not null,
  game_id text not null check (game_id in ('lototurf', 'quintuple-plus')),
  status text not null,
  fetched_at timestamptz not null default now(),
  races jsonb not null default '[]'::jsonb check (jsonb_typeof(races) = 'array'),
  result jsonb check (result is null or jsonb_typeof(result) = 'object'),
  documents jsonb not null default '[]'::jsonb check (jsonb_typeof(documents) = 'array'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  primary key (round_id, source_hash)
);

create index if not exists primy_sports_rounds_latest_idx on public.primy_sports_rounds (game_id, round_date desc nulls last, updated_at desc);
create index if not exists primy_sports_rounds_status_idx on public.primy_sports_rounds (game_id, status, sales_close_at desc nulls last);
create index if not exists primy_horse_rounds_latest_idx on public.primy_horse_rounds (game_id, round_date desc nulls last, updated_at desc);
create index if not exists primy_horse_rounds_status_idx on public.primy_horse_rounds (game_id, status, sales_close_at desc nulls last);

alter table public.primy_sports_rounds enable row level security;
alter table public.primy_sports_round_revisions enable row level security;
alter table public.primy_horse_rounds enable row level security;
alter table public.primy_horse_round_revisions enable row level security;

grant select on public.primy_sports_rounds, public.primy_horse_rounds to anon, authenticated;
grant all on public.primy_sports_rounds, public.primy_sports_round_revisions, public.primy_horse_rounds, public.primy_horse_round_revisions to service_role;
revoke all on public.primy_sports_round_revisions, public.primy_horse_round_revisions from anon, authenticated;

drop policy if exists "primy_sports_rounds_public_read" on public.primy_sports_rounds;
create policy "primy_sports_rounds_public_read" on public.primy_sports_rounds for select to anon, authenticated using (true);
drop policy if exists "primy_horse_rounds_public_read" on public.primy_horse_rounds;
create policy "primy_horse_rounds_public_read" on public.primy_horse_rounds for select to anon, authenticated using (true);

-- Unified event feed.
create table if not exists public.primy_verification_events (
  game_id text not null,
  event_key text not null,
  event_family text not null check (event_family in ('draw','sports','horse')),
  event_date date,
  round_id text,
  status text not null default 'official',
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  source_hash text,
  official_updated_at timestamptz,
  fetched_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (game_id, event_key)
);

create index if not exists primy_verification_events_lookup_idx
  on public.primy_verification_events (game_id, event_date desc nulls last, updated_at desc);
create index if not exists primy_verification_events_round_idx
  on public.primy_verification_events (game_id, round_id) where round_id is not null;
create index if not exists primy_verification_events_payload_gin_idx
  on public.primy_verification_events using gin (payload jsonb_path_ops);

alter table public.primy_verification_events enable row level security;
grant select on public.primy_verification_events to anon, authenticated;
grant all on public.primy_verification_events to service_role;
drop policy if exists "primy_verification_events_public_read" on public.primy_verification_events;
create policy "primy_verification_events_public_read" on public.primy_verification_events for select to anon, authenticated using (true);

create or replace function public.primy_set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists primy_sports_rounds_updated_at on public.primy_sports_rounds;
create trigger primy_sports_rounds_updated_at before update on public.primy_sports_rounds for each row execute function public.primy_set_updated_at();
drop trigger if exists primy_horse_rounds_updated_at on public.primy_horse_rounds;
create trigger primy_horse_rounds_updated_at before update on public.primy_horse_rounds for each row execute function public.primy_set_updated_at();
drop trigger if exists primy_verification_events_updated_at on public.primy_verification_events;
create trigger primy_verification_events_updated_at before update on public.primy_verification_events for each row execute function public.primy_set_updated_at();

create or replace function public.primy_mirror_draw_verification_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.primy_verification_events (
    game_id, event_key, event_family, event_date, round_id, status, payload,
    source_hash, official_updated_at, fetched_at, revision
  ) values (
    new.game_id,
    new.game_id || ':' || new.draw_date::text,
    'draw',
    new.draw_date,
    null,
    'official',
    jsonb_build_object(
      'gameId', new.game_id,
      'date', new.draw_date::text,
      'winningNumbers', to_jsonb(new.winning_numbers),
      'secondaryNumbers', to_jsonb(coalesce(new.secondary_numbers, '{}'::smallint[])),
      'extra', new.extra,
      'complementary', new.complementary,
      'prizes', coalesce(new.prizes, '[]'::jsonb),
      'jackpotNext', new.jackpot_next,
      'jackpotFormatted', coalesce(new.jackpot_formatted, ''),
      'source', new.source,
      'sourceUrl', coalesce(new.source_url, ''),
      'sourceHash', coalesce(new.source_hash, ''),
      'updatedAt', new.official_updated_at,
      'fetchedAt', new.fetched_at,
      'metadata', coalesce(new.metadata, '{}'::jsonb)
    ),
    new.source_hash,
    new.official_updated_at,
    new.fetched_at,
    1
  )
  on conflict (game_id, event_key) do update set
    payload = excluded.payload,
    source_hash = excluded.source_hash,
    official_updated_at = excluded.official_updated_at,
    fetched_at = excluded.fetched_at,
    status = excluded.status;
  return new;
end;
$$;

create or replace function public.primy_mirror_sports_verification_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.primy_verification_events (
    game_id, event_key, event_family, event_date, round_id, status, payload,
    source_hash, official_updated_at, fetched_at, revision
  ) values (
    new.game_id,
    new.round_id,
    'sports',
    new.round_date,
    new.round_id,
    new.status,
    jsonb_build_object(
      'roundId', new.round_id,
      'gameId', new.game_id,
      'season', coalesce(new.season, ''),
      'officialRoundNumber', coalesce(new.official_round_number, ''),
      'roundDate', new.round_date,
      'status', new.status,
      'salesOpenAt', new.sales_open_at,
      'salesCloseAt', new.sales_close_at,
      'source', new.source,
      'sourceUrl', coalesce(new.source_url, ''),
      'sourceHash', coalesce(new.source_hash, ''),
      'officialUpdatedAt', new.official_updated_at,
      'fetchedAt', new.fetched_at,
      'revision', new.revision,
      'matches', new.matches,
      'metadata', new.metadata
    ),
    new.source_hash,
    new.official_updated_at,
    new.fetched_at,
    new.revision
  )
  on conflict (game_id, event_key) do update set
    event_date = excluded.event_date,
    status = excluded.status,
    payload = excluded.payload,
    source_hash = excluded.source_hash,
    official_updated_at = excluded.official_updated_at,
    fetched_at = excluded.fetched_at,
    revision = excluded.revision;
  return new;
end;
$$;

create or replace function public.primy_mirror_horse_verification_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.primy_verification_events (
    game_id, event_key, event_family, event_date, round_id, status, payload,
    source_hash, official_updated_at, fetched_at, revision
  ) values (
    new.game_id,
    new.round_id,
    'horse',
    new.round_date,
    new.round_id,
    new.status,
    jsonb_build_object(
      'roundId', new.round_id,
      'gameId', new.game_id,
      'season', coalesce(new.season, ''),
      'officialRoundNumber', coalesce(new.official_round_number, ''),
      'roundDate', new.round_date,
      'status', new.status,
      'salesOpenAt', new.sales_open_at,
      'salesCloseAt', new.sales_close_at,
      'source', new.source,
      'sourceUrl', coalesce(new.source_url, ''),
      'programUrl', coalesce(new.program_url, ''),
      'withdrawalsUrl', coalesce(new.withdrawals_url, ''),
      'resultUrl', coalesce(new.result_url, ''),
      'sourceHash', coalesce(new.source_hash, ''),
      'officialUpdatedAt', new.official_updated_at,
      'fetchedAt', new.fetched_at,
      'revision', new.revision,
      'venue', coalesce(new.venue, ''),
      'races', new.races,
      'result', new.result,
      'documents', new.documents,
      'metadata', new.metadata
    ),
    new.source_hash,
    new.official_updated_at,
    new.fetched_at,
    new.revision
  )
  on conflict (game_id, event_key) do update set
    event_date = excluded.event_date,
    status = excluded.status,
    payload = excluded.payload,
    source_hash = excluded.source_hash,
    official_updated_at = excluded.official_updated_at,
    fetched_at = excluded.fetched_at,
    revision = excluded.revision;
  return new;
end;
$$;

drop trigger if exists primy_draw_results_verification_event on public.primy_draw_results;
create trigger primy_draw_results_verification_event after insert or update on public.primy_draw_results for each row execute function public.primy_mirror_draw_verification_event();
drop trigger if exists primy_sports_rounds_verification_event on public.primy_sports_rounds;
create trigger primy_sports_rounds_verification_event after insert or update on public.primy_sports_rounds for each row execute function public.primy_mirror_sports_verification_event();
drop trigger if exists primy_horse_rounds_verification_event on public.primy_horse_rounds;
create trigger primy_horse_rounds_verification_event after insert or update on public.primy_horse_rounds for each row execute function public.primy_mirror_horse_verification_event();

-- Backfill existing official data.
insert into public.primy_verification_events (
  game_id, event_key, event_family, event_date, round_id, status, payload,
  source_hash, official_updated_at, fetched_at, revision
)
select
  game_id,
  game_id || ':' || draw_date::text,
  'draw',
  draw_date,
  null,
  'official',
  jsonb_build_object(
    'gameId', game_id,
    'date', draw_date::text,
    'winningNumbers', to_jsonb(winning_numbers),
    'secondaryNumbers', to_jsonb(coalesce(secondary_numbers, '{}'::smallint[])),
    'extra', extra,
    'complementary', complementary,
    'prizes', coalesce(prizes, '[]'::jsonb),
    'jackpotNext', jackpot_next,
    'jackpotFormatted', coalesce(jackpot_formatted, ''),
    'source', source,
    'sourceUrl', coalesce(source_url, ''),
    'sourceHash', coalesce(source_hash, ''),
    'updatedAt', official_updated_at,
    'fetchedAt', fetched_at,
    'metadata', coalesce(metadata, '{}'::jsonb)
  ),
  source_hash,
  official_updated_at,
  fetched_at,
  1
from public.primy_draw_results
on conflict (game_id, event_key) do update set
  payload = excluded.payload,
  source_hash = excluded.source_hash,
  official_updated_at = excluded.official_updated_at,
  fetched_at = excluded.fetched_at;

insert into public.primy_verification_events (
  game_id, event_key, event_family, event_date, round_id, status, payload,
  source_hash, official_updated_at, fetched_at, revision
)
select
  game_id,
  round_id,
  'sports',
  round_date,
  round_id,
  status,
  jsonb_build_object(
    'roundId', round_id, 'gameId', game_id, 'season', coalesce(season, ''),
    'officialRoundNumber', coalesce(official_round_number, ''), 'roundDate', round_date,
    'status', status, 'salesOpenAt', sales_open_at, 'salesCloseAt', sales_close_at,
    'source', source, 'sourceUrl', coalesce(source_url, ''), 'sourceHash', coalesce(source_hash, ''),
    'officialUpdatedAt', official_updated_at, 'fetchedAt', fetched_at, 'revision', revision,
    'matches', matches, 'metadata', metadata
  ),
  source_hash,
  official_updated_at,
  fetched_at,
  revision
from public.primy_sports_rounds
on conflict (game_id, event_key) do update set
  event_date = excluded.event_date, status = excluded.status, payload = excluded.payload,
  source_hash = excluded.source_hash, official_updated_at = excluded.official_updated_at,
  fetched_at = excluded.fetched_at, revision = excluded.revision;

insert into public.primy_verification_events (
  game_id, event_key, event_family, event_date, round_id, status, payload,
  source_hash, official_updated_at, fetched_at, revision
)
select
  game_id,
  round_id,
  'horse',
  round_date,
  round_id,
  status,
  jsonb_build_object(
    'roundId', round_id, 'gameId', game_id, 'season', coalesce(season, ''),
    'officialRoundNumber', coalesce(official_round_number, ''), 'roundDate', round_date,
    'status', status, 'salesOpenAt', sales_open_at, 'salesCloseAt', sales_close_at,
    'source', source, 'sourceUrl', coalesce(source_url, ''), 'programUrl', coalesce(program_url, ''),
    'withdrawalsUrl', coalesce(withdrawals_url, ''), 'resultUrl', coalesce(result_url, ''),
    'sourceHash', coalesce(source_hash, ''), 'officialUpdatedAt', official_updated_at,
    'fetchedAt', fetched_at, 'revision', revision, 'venue', coalesce(venue, ''),
    'races', races, 'result', result, 'documents', documents, 'metadata', metadata
  ),
  source_hash,
  official_updated_at,
  fetched_at,
  revision
from public.primy_horse_rounds
on conflict (game_id, event_key) do update set
  event_date = excluded.event_date, status = excluded.status, payload = excluded.payload,
  source_hash = excluded.source_hash, official_updated_at = excluded.official_updated_at,
  fetched_at = excluded.fetched_at, revision = excluded.revision;

create or replace function public.primy_fast_verification_feed(
  p_game_id text,
  p_dates date[] default null,
  p_round_ids text[] default null
)
returns setof public.primy_verification_events
language sql stable security invoker set search_path = public as $$
  select event.*
  from public.primy_verification_events event
  where event.game_id = p_game_id
    and (
      (p_dates is not null and event.event_date = any(p_dates))
      or (p_round_ids is not null and event.round_id = any(p_round_ids))
    )
  order by event.event_date asc nulls last, event.updated_at asc;
$$;

grant execute on function public.primy_fast_verification_feed(text, date[], text[]) to anon, authenticated;



-- Trigger helpers are internal only. They must never be callable through the public RPC API.
revoke all on function public.primy_mirror_draw_verification_event() from public, anon, authenticated;
revoke all on function public.primy_mirror_sports_verification_event() from public, anon, authenticated;
revoke all on function public.primy_mirror_horse_verification_event() from public, anon, authenticated;
grant execute on function public.primy_mirror_draw_verification_event() to service_role;
grant execute on function public.primy_mirror_sports_verification_event() to service_role;
grant execute on function public.primy_mirror_horse_verification_event() to service_role;

-- Realtime publication: clients can receive official result events immediately.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'primy_verification_events'
     ) then
    alter publication supabase_realtime add table public.primy_verification_events;
  end if;
end $$;

-- Replace legacy schedules with the unified Fast orchestrator.
do $$
declare
  job record;
begin
  for job in
    select jobid from cron.job where jobname in (
      'primy-sync-selae-daily',
      'primy-sync-selae-evening',
      'primy-sync-selae-morning',
      'primy-sync-selae-fast-evening',
      'primy-sync-selae-late-fallback',
      'primy-sync-sports-rounds',
      'primy-fast-sync-peak',
      'primy-fast-sync-late',
      'primy-fast-sync-day'
    )
  loop
    perform cron.unschedule(job.jobid);
  end loop;
end $$;

select cron.schedule(
  'primy-fast-sync-peak',
  '*/2 16-23 * * *',
  $cron$
    select net.http_post(
      url := 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/scheduled-sync-all-results',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"trigger":"fast-peak"}'::jsonb,
      timeout_milliseconds := 90000
    );
  $cron$
);

select cron.schedule(
  'primy-fast-sync-late',
  '*/5 0-2 * * *',
  $cron$
    select net.http_post(
      url := 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/scheduled-sync-all-results',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"trigger":"fast-late"}'::jsonb,
      timeout_milliseconds := 90000
    );
  $cron$
);

select cron.schedule(
  'primy-fast-sync-day',
  '*/15 7-15 * * *',
  $cron$
    select net.http_post(
      url := 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/scheduled-sync-all-results',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"trigger":"fast-day"}'::jsonb,
      timeout_milliseconds := 90000
    );
  $cron$
);
