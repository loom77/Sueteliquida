-- Primy v17.1.0 — Universal Sports & Horse Verification
-- Hardens official result publication and optimizes the Realtime verification feed.

create index if not exists primy_sports_rounds_official_results_idx
  on public.primy_sports_rounds (game_id, round_date desc, official_updated_at desc)
  where status = 'official';

create index if not exists primy_horse_rounds_official_results_idx
  on public.primy_horse_rounds (game_id, round_date desc, official_updated_at desc)
  where status = 'official' and result is not null;

create index if not exists primy_verification_events_official_fast_idx
  on public.primy_verification_events (game_id, round_id, event_date desc, updated_at desc)
  where status = 'official';

create or replace function public.primy_validate_official_sports_result()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  expected integer;
begin
  if new.status <> 'official' then
    return new;
  end if;
  expected := case new.game_id when 'quiniela' then 15 when 'quinigol' then 6 else 0 end;
  if expected = 0 or jsonb_array_length(new.matches) <> expected then
    raise exception 'Official sports result has an invalid match count for %', new.game_id;
  end if;
  if exists (
    select 1
    from jsonb_array_elements(new.matches) as item
    where jsonb_typeof(item->'officialScore') <> 'object'
       or jsonb_typeof(item->'officialScore'->'home') <> 'number'
       or jsonb_typeof(item->'officialScore'->'away') <> 'number'
  ) then
    raise exception 'Official sports result is missing a numeric officialScore for %', new.game_id;
  end if;
  return new;
end;
$$;

create or replace function public.primy_validate_official_horse_result()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'official' and (new.result is null or not (new.result @> '{"valid": true}'::jsonb)) then
    raise exception 'Official horse round requires a validated official result for %', new.game_id;
  end if;
  return new;
end;
$$;

drop trigger if exists primy_validate_official_sports_result_trigger on public.primy_sports_rounds;
create trigger primy_validate_official_sports_result_trigger
before insert or update of status, matches on public.primy_sports_rounds
for each row execute function public.primy_validate_official_sports_result();

drop trigger if exists primy_validate_official_horse_result_trigger on public.primy_horse_rounds;
create trigger primy_validate_official_horse_result_trigger
before insert or update of status, result on public.primy_horse_rounds
for each row execute function public.primy_validate_official_horse_result();

-- Refresh mirrored payloads so the Fast feed immediately exposes result metadata,
-- categories and official scores with the latest schema.
update public.primy_sports_rounds set fetched_at = fetched_at where status in ('provisional', 'official');
update public.primy_horse_rounds set fetched_at = fetched_at where status in ('provisional', 'official');

revoke all on function public.primy_validate_official_sports_result() from public, anon, authenticated;
revoke all on function public.primy_validate_official_horse_result() from public, anon, authenticated;
grant execute on function public.primy_validate_official_sports_result() to service_role;
grant execute on function public.primy_validate_official_horse_result() to service_role;
