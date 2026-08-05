-- Primy v17.0.1: elimina snapshots deportivos con identidad falsa y refuerza
-- posiciones, duplicados y tipo de pronóstico antes de publicar una jornada.

delete from public.primy_verification_events
where event_family = 'sports'
  and round_id in ('quiniela:2025-2026:76', 'quinigol:2025-2026:88')
  and (
    coalesce(payload #>> '{metadata,parserVersion}', '') = 'sports-checker-v7'
    or coalesce(payload #>> '{metadata,compositionVerified}', 'false') <> 'true'
    or coalesce(payload #>> '{metadata,identityVerified}', 'false') <> 'true'
  );

delete from public.primy_sports_round_revisions
where round_id in ('quiniela:2025-2026:76', 'quinigol:2025-2026:88')
  and (
    coalesce(metadata->>'parserVersion', '') = 'sports-checker-v7'
    or coalesce(metadata->>'compositionVerified', 'false') <> 'true'
    or coalesce(metadata->>'identityVerified', 'false') <> 'true'
  );

delete from public.primy_sports_rounds
where round_id in ('quiniela:2025-2026:76', 'quinigol:2025-2026:88')
  and (
    coalesce(metadata->>'parserVersion', '') = 'sports-checker-v7'
    or coalesce(metadata->>'compositionVerified', 'false') <> 'true'
    or coalesce(metadata->>'identityVerified', 'false') <> 'true'
  );

create or replace function public.primy_validate_sports_round_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  expected_count integer;
  match_item jsonb;
  position_value integer;
  home_team text;
  away_team text;
  pair_key text;
  prediction_type text;
  seen_positions integer[] := '{}';
  seen_pairs text[] := '{}';
begin
  if new.status in ('sales-open', 'published', 'document-published') then
    expected_count := case new.game_id when 'quiniela' then 15 when 'quinigol' then 6 else null end;
    if expected_count is null then
      raise exception 'Unsupported sports game_id: %', new.game_id;
    end if;
    if nullif(trim(new.official_round_number), '') is null
       or new.round_date is null
       or new.sales_close_at is null
       or nullif(trim(new.source_hash), '') is null
       or coalesce(new.metadata->>'identityVerified', 'false') <> 'true'
       or coalesce(new.metadata->>'compositionVerified', 'false') <> 'true' then
      raise exception 'Operational sports rounds require verified identity, composition, date, close and source hash.';
    end if;
    if jsonb_typeof(new.matches) <> 'array' or jsonb_array_length(new.matches) <> expected_count then
      raise exception 'Sports round % requires % validated matches.', new.game_id, expected_count;
    end if;
    for match_item in select value from jsonb_array_elements(new.matches)
    loop
      position_value := nullif(match_item->>'position', '')::integer;
      home_team := trim(coalesce(match_item->>'homeTeam', ''));
      away_team := trim(coalesce(match_item->>'awayTeam', ''));
      prediction_type := coalesce(match_item->>'predictionType', match_item #>> '{metadata,predictionType}', '');
      pair_key := lower(home_team) || '::' || lower(away_team);
      if position_value is null or position_value < 1 or position_value > expected_count
         or position_value = any(seen_positions) then
        raise exception 'Sports round contains a missing, invalid or duplicated position.';
      end if;
      seen_positions := array_append(seen_positions, position_value);
      if home_team = '' or away_team = ''
         or home_team ~* '(https?://|www\.|\[|\]|\.com\y|añadir[[:space:]]+a|elige[[:space:]]*8)'
         or away_team ~* '(https?://|www\.|\[|\]|\.com\y|añadir[[:space:]]+a|elige[[:space:]]*8)'
         or lower(home_team) = lower(away_team) then
        raise exception 'Sports round contains an invalid or contaminated team name.';
      end if;
      if pair_key = any(seen_pairs) then
        raise exception 'Sports round contains a duplicated home-away pair.';
      end if;
      seen_pairs := array_append(seen_pairs, pair_key);
      if new.game_id = 'quiniela' and position_value <= 14 and prediction_type <> 'one-x-two' then
        raise exception 'Quiniela positions 1-14 require one-x-two prediction type.';
      end if;
      if new.game_id = 'quiniela' and position_value = 15 and prediction_type <> 'pleno15' then
        raise exception 'Quiniela position 15 requires pleno15 prediction type.';
      end if;
      if new.game_id = 'quinigol' and prediction_type <> 'score-buckets' then
        raise exception 'Quinigol positions require score-buckets prediction type.';
      end if;
    end loop;
    if cardinality(seen_positions) <> expected_count then
      raise exception 'Sports round does not contain a contiguous complete position set.';
    end if;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
