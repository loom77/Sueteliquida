-- Primy v17.0: blocca giornate sportive/ippiche incomplete e rimuove le righe provvisorie corrotte.

delete from public.primy_verification_events
where event_family = 'sports'
  and (round_id in ('quiniela:current', 'quinigol:current')
       or coalesce(payload #>> '{metadata,provisionalIdentity}', 'false') = 'true');

delete from public.primy_sports_round_revisions
where round_id in ('quiniela:current', 'quinigol:current')
   or coalesce(metadata->>'provisionalIdentity', 'false') = 'true';

delete from public.primy_sports_rounds
where round_id in ('quiniela:current', 'quinigol:current')
   or coalesce(metadata->>'provisionalIdentity', 'false') = 'true'
   or official_round_number is null
   or round_date is null
   or sales_close_at is null;

create or replace function public.primy_validate_sports_round_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  expected_count integer;
  match_item jsonb;
  home_team text;
  away_team text;
begin
  if new.status in ('sales-open', 'published', 'document-published') then
    expected_count := case new.game_id when 'quiniela' then 15 when 'quinigol' then 6 else null end;
    if expected_count is null then
      raise exception 'Unsupported sports game_id: %', new.game_id;
    end if;
    if nullif(trim(new.official_round_number), '') is null
       or new.round_date is null
       or new.sales_close_at is null
       or nullif(trim(new.source_hash), '') is null then
      raise exception 'Operational sports rounds require official identity, date, close and source hash.';
    end if;
    if jsonb_typeof(new.matches) <> 'array' or jsonb_array_length(new.matches) <> expected_count then
      raise exception 'Sports round % requires % validated matches.', new.game_id, expected_count;
    end if;
    for match_item in select value from jsonb_array_elements(new.matches)
    loop
      home_team := trim(coalesce(match_item->>'homeTeam', ''));
      away_team := trim(coalesce(match_item->>'awayTeam', ''));
      if home_team = '' or away_team = ''
         or home_team ~* '(https?://|www\.|\[|\]|\.com\y|añadir[[:space:]]+a|elige[[:space:]]*8)'
         or away_team ~* '(https?://|www\.|\[|\]|\.com\y|añadir[[:space:]]+a|elige[[:space:]]*8)'
         or lower(home_team) = lower(away_team) then
        raise exception 'Sports round contains an invalid or contaminated team name.';
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists primy_validate_sports_round_write_trigger on public.primy_sports_rounds;
create trigger primy_validate_sports_round_write_trigger
before insert or update on public.primy_sports_rounds
for each row execute function public.primy_validate_sports_round_write();

create or replace function public.primy_validate_horse_round_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  expected_count integer;
  race_item jsonb;
  runner_count integer;
  max_runners integer;
begin
  if new.status in ('sales-open', 'document-published') then
    expected_count := case new.game_id when 'lototurf' then 1 when 'quintuple-plus' then 5 else null end;
    max_runners := case new.game_id when 'lototurf' then 12 else 20 end;
    if expected_count is null then
      raise exception 'Unsupported horse game_id: %', new.game_id;
    end if;
    if nullif(trim(new.official_round_number), '') is null
       or new.round_date is null
       or nullif(trim(new.source_hash), '') is null then
      raise exception 'Operational horse rounds require official identity, date and source hash.';
    end if;
    if jsonb_typeof(new.races) <> 'array' or jsonb_array_length(new.races) <> expected_count then
      raise exception 'Horse round % requires % validated races.', new.game_id, expected_count;
    end if;
    for race_item in select value from jsonb_array_elements(new.races)
    loop
      runner_count := case when jsonb_typeof(race_item->'runners') = 'array' then jsonb_array_length(race_item->'runners') else 0 end;
      if runner_count < 3 or runner_count > max_runners then
        raise exception 'Horse race contains an invalid number of runners: %.', runner_count;
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists primy_validate_horse_round_write_trigger on public.primy_horse_rounds;
create trigger primy_validate_horse_round_write_trigger
before insert or update on public.primy_horse_rounds
for each row execute function public.primy_validate_horse_round_write();

revoke all on function public.primy_validate_sports_round_write() from public, anon, authenticated;
revoke all on function public.primy_validate_horse_round_write() from public, anon, authenticated;
