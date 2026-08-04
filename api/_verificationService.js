import { getDrawsForDates } from './_drawService.js';
import { readSportsRound, readSportsRoundRange, upsertSportsRounds } from './_sportsRoundRepository.js';
import { readHorseRound, readHorseRoundRange, upsertHorseRounds } from './_horseRoundRepository.js';
import { fetchOfficialSportsRound } from './_sportsOfficialProvider.js';
import { fetchOfficialHorseResult } from './_horseOfficialProvider.js';
import { mergeHorseProgramAndResult } from '../src/horse/officialHorseParser.js';
import { readVerificationEvents, verificationEventRepositoryStatus } from './_verificationEventRepository.js';
import { verificationFamilyForGame, VERIFICATION_FAMILIES } from '../src/verification/verificationEngine.js';

function dedupe(values) {
  return [...new Set((values || []).map(value => String(value || '').trim()).filter(Boolean))];
}

function eventFromDraw(draw) {
  return {
    gameId: draw.gameId,
    family: VERIFICATION_FAMILIES.DRAW,
    eventKey: `${draw.gameId}:${draw.date}`,
    date: draw.date,
    roundId: '',
    status: 'official',
    payload: draw,
    sourceHash: draw.sourceHash || '',
    fetchedAt: draw.fetchedAt || null,
    revision: 1,
  };
}

function eventFromRound(round, family) {
  return {
    gameId: round.gameId,
    family,
    eventKey: round.roundId || `${round.gameId}:${round.roundDate || 'current'}`,
    date: round.roundDate || null,
    roundId: round.roundId || '',
    status: round.status || '',
    payload: round,
    sourceHash: round.sourceHash || '',
    fetchedAt: round.fetchedAt || null,
    revision: Number(round.revision || 1),
  };
}

function eventMatches(event, dates, roundIds) {
  return (event?.date && dates.includes(event.date)) || (event?.roundId && roundIds.includes(event.roundId));
}

async function fetchDrawEvents(game, dates, options) {
  const result = await getDrawsForDates(game, dates, { fetchMissing: true, fetchImpl: options.fetchImpl });
  return {
    events: result.draws.map(eventFromDraw),
    errors: result.errors || [],
    liveFetched: result.liveFetched || 0,
    repository: result.repository,
  };
}

async function fetchSportsEvents(gameId, dates, roundIds, options) {
  const found = [];
  const errors = [];
  for (const roundId of roundIds) {
    const round = await readSportsRound(roundId, { fetchImpl: options.fetchImpl });
    if (round?.gameId === gameId) found.push(round);
  }
  if (dates.length) {
    const ranged = await readSportsRoundRange(gameId, dates[0], dates.at(-1), { fetchImpl: options.fetchImpl });
    for (const round of ranged) if (!found.some(item => item.roundId === round.roundId)) found.push(round);
  }

  const missing = [...dates.filter(date => !found.some(round => round.roundDate === date)), ...roundIds.filter(id => !found.some(round => round.roundId === id))];
  let liveFetched = 0;
  if (missing.length) {
    try {
      const live = await fetchOfficialSportsRound(gameId, { fetchImpl: options.fetchImpl, timeoutMs: 14000 });
      await upsertSportsRounds([live], { fetchImpl: options.fetchImpl });
      if (eventMatches(eventFromRound(live, VERIFICATION_FAMILIES.SPORTS), dates, roundIds)) {
        found.push(live);
        liveFetched = 1;
      }
    } catch (error) {
      errors.push({ code: error?.code || 'SPORTS_LIVE_RESULT_ERROR', message: error?.message || 'Resultado deportivo no disponible.' });
    }
  }
  return {
    events: found.map(round => eventFromRound(round, VERIFICATION_FAMILIES.SPORTS)),
    errors,
    liveFetched,
    repository: { backend: 'sports-rounds' },
  };
}

async function fetchHorseEvents(gameId, dates, roundIds, options) {
  const found = [];
  const errors = [];
  for (const roundId of roundIds) {
    const round = await readHorseRound(roundId, { fetchImpl: options.fetchImpl });
    if (round?.gameId === gameId) found.push(round);
  }
  if (dates.length) {
    const ranged = await readHorseRoundRange(gameId, dates[0], dates.at(-1), { fetchImpl: options.fetchImpl });
    for (const round of ranged) if (!found.some(item => item.roundId === round.roundId)) found.push(round);
  }

  let liveFetched = 0;
  for (const date of dates.filter(value => !found.some(round => round.roundDate === value && round.result?.valid))) {
    try {
      const previous = found.find(round => round.roundDate === date) || null;
      const result = await fetchOfficialHorseResult(gameId, date, {
        fetchImpl: options.fetchImpl,
        roundDate: date,
        officialRoundNumber: previous?.officialRoundNumber,
        season: previous?.season,
        races: previous?.races || [],
      });
      const merged = previous ? mergeHorseProgramAndResult(previous, result) : result;
      await upsertHorseRounds([merged], { fetchImpl: options.fetchImpl });
      const index = found.findIndex(round => round.roundId === merged.roundId || round.roundDate === date);
      if (index >= 0) found[index] = merged;
      else found.push(merged);
      liveFetched += 1;
    } catch (error) {
      errors.push({ date, code: error?.code || 'HORSE_LIVE_RESULT_ERROR', message: error?.message || 'Resultado hípico no disponible.' });
    }
  }
  return {
    events: found.map(round => eventFromRound(round, VERIFICATION_FAMILIES.HORSE)),
    errors,
    liveFetched,
    repository: { backend: 'horse-rounds' },
  };
}

export async function getVerificationEvents(game, { dates = [], roundIds = [], fetchImpl = globalThis.fetch } = {}) {
  const wantedDates = dedupe(dates).sort();
  const wantedRoundIds = dedupe(roundIds);
  const family = verificationFamilyForGame(game.id);
  if (!family) return { events: [], unavailableDates: wantedDates, unavailableRoundIds: wantedRoundIds, errors: [], liveFetched: 0 };

  const unified = await readVerificationEvents(game.id, { dates: wantedDates, roundIds: wantedRoundIds, fetchImpl });
  const cached = unified.events.filter(event => eventMatches(event, wantedDates, wantedRoundIds));
  const missingDates = wantedDates.filter(date => !cached.some(event => event.date === date));
  const missingRoundIds = wantedRoundIds.filter(roundId => !cached.some(event => event.roundId === roundId));
  let fallback = { events: [], errors: [], liveFetched: 0, repository: {} };

  if (missingDates.length || missingRoundIds.length) {
    if (family === VERIFICATION_FAMILIES.DRAW) fallback = await fetchDrawEvents(game, missingDates, { fetchImpl });
    else if (family === VERIFICATION_FAMILIES.SPORTS) fallback = await fetchSportsEvents(game.id, missingDates, missingRoundIds, { fetchImpl });
    else fallback = await fetchHorseEvents(game.id, missingDates, missingRoundIds, { fetchImpl });
  }

  const byKey = new Map();
  for (const event of [...cached, ...fallback.events]) byKey.set(`${event.gameId}:${event.roundId || event.date}`, event);
  const events = [...byKey.values()];
  return {
    events,
    unavailableDates: wantedDates.filter(date => !events.some(event => event.date === date)),
    unavailableRoundIds: wantedRoundIds.filter(roundId => !events.some(event => event.roundId === roundId)),
    errors: fallback.errors || [],
    liveFetched: fallback.liveFetched || 0,
    repository: {
      unified: verificationEventRepositoryStatus(),
      fallback: fallback.repository || null,
    },
  };
}
