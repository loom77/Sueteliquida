import { GAMES } from '../src/utils/gameConfig.js';
import { drawDatesInRange, fetchOfficialDraw } from '../api/_selaeProvider.js';
import { readDrawRange, repositoryStatus, upsertDraws } from '../api/_drawRepository.js';

function argument(name, fallback = '') {
  const prefix = `--${name}=`;
  const value = process.argv.find(item => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

const gameArg = argument('game', 'all');
const from = argument('from', '2016-01-01');
const to = argument('to', new Date().toISOString().slice(0, 10));
const delayMs = Math.max(150, Number(argument('delay', '400')) || 400);
const batchSize = Math.max(1, Math.min(50, Number(argument('batch', '20')) || 20));
const games = gameArg === 'all' ? Object.values(GAMES) : [GAMES[gameArg]].filter(Boolean);

if (!games.length) throw new Error('Juego no válido. Usa --game=primitiva, --game=eurodreams o --game=all.');
if (!repositoryStatus().configured) {
  throw new Error('Configura SUPABASE_SERVICE_ROLE_KEY y SUPABASE_URL antes de ejecutar la importación.');
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

for (const game of games) {
  const dates = drawDatesInRange(game, from, to);
  const existing = await readDrawRange(game.id, from, to);
  const existingDates = new Set(existing.map(draw => draw.date));
  const missing = dates.filter(date => !existingDates.has(date));
  console.log(`[${game.name}] ${existing.length} archivados; ${missing.length} fechas pendientes.`);

  let batch = [];
  let imported = 0;
  let unavailable = 0;
  for (const [index, date] of missing.entries()) {
    try {
      const draw = await fetchOfficialDraw({ game, date, timeoutMs: 15000 });
      batch.push({ ...draw, gameId: game.id, fetchedAt: new Date().toISOString() });
      imported += 1;
      if (batch.length >= batchSize) {
        await upsertDraws(batch);
        batch = [];
      }
      console.log(`[${game.name}] ${date} importado (${index + 1}/${missing.length}).`);
    } catch (error) {
      unavailable += 1;
      console.warn(`[${game.name}] ${date}: ${error.code || 'ERROR'} ${error.message || ''}`);
    }
    await wait(delayMs);
  }
  if (batch.length) await upsertDraws(batch);
  console.log(`[${game.name}] finalizado: ${imported} importados, ${unavailable} no disponibles.`);
}
