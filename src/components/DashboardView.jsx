import React, { useMemo } from 'react';
import { GAMES, getGameConfig } from '../utils/gameConfig.js';
import { formatDrawDate, formatDrawTime, formatSyncTime, getNextDrawInfo } from '../utils/drawSchedule.js';
import { playCost, playKnownPrize } from '../utils/playModel.js';
import { TicketStatus } from './TicketUI.jsx';
import {
  ArrowRightIcon,
  CalendarIcon,
  EditIcon,
  RefreshIcon,
  TicketIcon,
  WalletIcon,
} from './Icons.jsx';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

function GameCard({ draw, onSelect }) {
  const game = getGameConfig(draw.gameId);
  const isPrimitiva = game.id === 'primitiva';
  const accent = isPrimitiva
    ? {
        border: 'hover:border-emerald-400 focus-visible:border-emerald-500',
        icon: 'bg-emerald-100 text-emerald-800',
        label: 'text-emerald-800',
        button: 'bg-emerald-700 hover:bg-emerald-800',
      }
    : {
        border: 'hover:border-violet-400 focus-visible:border-violet-500',
        icon: 'bg-violet-100 text-violet-800',
        label: 'text-violet-800',
        button: 'bg-violet-700 hover:bg-violet-800',
      };

  return (
    <article className={`group flex min-h-full flex-col rounded-3xl border-2 border-default bg-surface p-5 transition sm:p-6 ${accent.border}`}>
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent.icon}`}>
          <TicketIcon width="23" height="23"/>
        </span>
        <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-secondary">
          {euro.format(game.price)} a colonna
        </span>
      </div>

      <div className="mt-5">
        <p className={`text-sm font-black ${accent.label}`}>Scegli questo gioco</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-primary sm:text-3xl">{game.name}</h2>
        <p className="mt-2 text-sm leading-6 text-secondary">
          {game.numbersToPick} numeri da 1 a {game.numberPoolMax} + {game.extra.label.toLowerCase()}.
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-muted p-4">
        <CalendarIcon width="18" height="18" className="shrink-0 text-secondary"/>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-secondary">Prossima estrazione</p>
          <p className="mt-1 text-sm font-black capitalize text-primary">{formatDrawDate(draw.drawDateTimeISO, { includeYear: false })} alle {formatDrawTime(draw.drawDateTimeISO)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSelect(game.id)}
        className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-white ${accent.button}`}
        aria-label={`Scegli ${game.name} e continua alla generazione`}
      >
        Scegli {game.shortName}<ArrowRightIcon width="18" height="18"/>
      </button>
    </article>
  );
}

function Stat({ label, value, detail, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary">
        <Icon width="19" height="19"/>
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">{label}</p>
        <p className="mt-0.5 text-lg font-black text-primary">{value}</p>
        <p className="mt-0.5 text-xs text-secondary">{detail}</p>
      </div>
    </div>
  );
}

export default function DashboardView({
  now,
  history,
  monthlyStats,
  totals,
  dueByGame,
  drawOverview,
  onGenerate,
  onAddExternal,
  onOpenPlays,
  onCheckAll,
  checking,
}) {
  const draws = useMemo(
    () => ['primitiva', 'eurodreams']
      .filter(gameId => GAMES[gameId])
      .map(gameId => ({ gameId, ...getNextDrawInfo(gameId, now) })),
    [now],
  );
  const dueTotal = Object.values(dueByGame).reduce((sum, count) => sum + count, 0);
  const recent = history.slice(0, 3);
  const hasPlays = history.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <p className="text-sm font-black text-indigo-700">Nuova giocata</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-primary sm:text-4xl">Cosa vuoi giocare?</h1>
        <p className="mt-3 text-base leading-7 text-secondary">
          Scegli un gioco. Primy ti accompagnerà poi nella scelta del budget e nella creazione della schedina.
        </p>
      </header>

      {dueTotal > 0 && (
        <section className="flex flex-col gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Giocate da verificare">
          <div>
            <p className="font-black text-amber-950">Hai {dueTotal} {dueTotal === 1 ? 'giocata da verificare' : 'giocate da verificare'}</p>
            <p className="mt-1 text-sm leading-6 text-amber-900">Puoi controllare i risultati ora oppure creare una nuova giocata.</p>
          </div>
          <button type="button" onClick={onCheckAll} disabled={checking} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-black text-amber-950 hover:bg-amber-300 disabled:opacity-60">
            <RefreshIcon className={checking ? 'animate-spin' : ''} width="18" height="18"/>
            {checking ? 'Controllo…' : 'Controlla risultati'}
          </button>
        </section>
      )}

      <section aria-labelledby="game-choice-title">
        <h2 id="game-choice-title" className="sr-only">Scegli il gioco</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {draws.map(draw => (
            <GameCard
              key={draw.gameId}
              draw={draw}
              onSelect={onGenerate}
            />
          ))}
        </div>
      </section>

      {!hasPlays ? (
        <section className="rounded-3xl border border-default bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-primary">Hai già comprato una schedina?</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary">Aggiungila manualmente per ricordare quando controllarla. Non devi generare una nuova giocata.</p>
            </div>
            <button type="button" onClick={onAddExternal} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-default px-5 text-sm font-black text-primary hover:bg-muted">
              <EditIcon width="18" height="18"/>Aggiungi schedina
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-default bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black text-indigo-700">Le tue giocate</p>
              <h2 className="mt-1 text-2xl font-black text-primary">Situazione attuale</h2>
            </div>
            <button type="button" onClick={onOpenPlays} className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-indigo-700 hover:bg-indigo-50">
              Vedi tutte<ArrowRightIcon width="17" height="17"/>
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat label="Spesa del mese" value={euro.format(monthlyStats.spent)} detail={`${monthlyStats.plays} giocate registrate`} icon={WalletIcon}/>
            <Stat label="Da verificare" value={dueTotal} detail={dueTotal ? 'Richiede attenzione' : 'Tutto aggiornato'} icon={RefreshIcon}/>
            <Stat label="Colonne acquistate" value={totals.columns} detail={`${totals.plays} giocate`} icon={TicketIcon}/>
          </div>

          <div className="mt-6 border-t border-default pt-2">
            {recent.map(play => (
              <button type="button" key={play.id} onClick={onOpenPlays} className="grid min-h-16 w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-default py-4 text-left last:border-b-0 hover:bg-muted">
                <div>
                  <p className="font-black text-primary">{getGameConfig(play.gameId).name} · {play.columns.length} {play.columns.length === 1 ? 'colonna' : 'colonne'}</p>
                  <p className="mt-1 text-sm capitalize text-secondary">
                    {formatDrawDate(play.drawDateISO, { short: true })} · {euro.format(playCost(play))}
                    {play.status === 'checked' ? ` · premi ${euro.format(playKnownPrize(play))}` : ''}
                  </p>
                </div>
                <TicketStatus status={play.computedStatus}/>
              </button>
            ))}
          </div>
        </section>
      )}

      <details className="group rounded-2xl border border-default bg-surface">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-black text-primary">
          <span>Orari delle prossime estrazioni</span>
          <span className="text-sm font-bold text-indigo-700 group-open:hidden">Mostra</span>
          <span className="hidden text-sm font-bold text-indigo-700 group-open:inline">Nascondi</span>
        </summary>
        <div className="border-t border-default px-5 pb-5">
          <div className="divide-y divide-default">
            {draws.map(draw => {
              const game = getGameConfig(draw.gameId);
              return (
                <div key={draw.gameId} className="grid gap-3 py-4 sm:grid-cols-[1fr_repeat(3,auto)] sm:items-center sm:gap-7">
                  <div>
                    <p className="font-black text-primary">{game.name}</p>
                    <p className="mt-1 text-sm capitalize text-secondary">{formatDrawDate(draw.drawDateTimeISO, { includeYear: false })}</p>
                  </div>
                  <div><p className="text-xs font-bold text-secondary">Chiusura</p><p className="mt-1 font-black text-primary">{formatDrawTime(draw.salesCloseISO)}</p></div>
                  <div><p className="text-xs font-bold text-secondary">Estrazione</p><p className="mt-1 font-black text-primary">{formatDrawTime(draw.drawDateTimeISO)}</p></div>
                  <div><p className="text-xs font-bold text-secondary">Risultati</p><p className="mt-1 font-black text-primary">{formatDrawTime(draw.resultPublicationISO)}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </details>

      <footer className="flex flex-col gap-2 border-t border-default pt-5 text-xs leading-5 text-secondary sm:flex-row sm:items-center sm:justify-between">
        <p>Primy non vende schedine e non garantisce vincite. Solo per maggiorenni.</p>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${drawOverview.loading ? 'bg-slate-400' : drawOverview.error ? 'bg-amber-500' : 'bg-emerald-500'}`}/>
          <span>
            {drawOverview.loading
              ? 'Aggiornamento dati…'
              : drawOverview.fetchedAt
                ? `Dati aggiornati ${formatSyncTime(drawOverview.fetchedAt)}`
                : 'Dati esterni non disponibili'}
          </span>
          {drawOverview.error && <button type="button" onClick={drawOverview.reload} className="font-black text-indigo-700">Riprova</button>}
        </div>
      </footer>
    </div>
  );
}
