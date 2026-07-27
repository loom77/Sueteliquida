import React, { useMemo } from 'react';
import { GAMES, getGameConfig } from '../utils/gameConfig.js';
import { formatCountdown, formatDrawDate, formatDrawTime, formatSyncTime, getNextDrawInfo } from '../utils/drawSchedule.js';
import { playCost, playKnownPrize } from '../utils/playModel.js';
import { TicketStatus } from './TicketUI.jsx';
import { ArrowRightIcon, CalendarIcon, ChartIcon, ClockIcon, EditIcon, InstallIcon, PlusIcon, RefreshIcon, TicketIcon, WalletIcon } from './Icons.jsx';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const compactEuro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 });

function jackpotLabel(data, game) {
  if (Number.isFinite(data?.jackpotNext) && data.jackpotNext > 0) return compactEuro.format(data.jackpotNext);
  if (data?.jackpotFormatted) return data.jackpotFormatted;
  return game.id === 'eurodreams' ? game.payoff : 'Bote non disponibile';
}

function SummaryItem({ label, value, detail, icon: Icon }) {
  return <article className="py-4 sm:px-5 sm:first:pl-0"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted-strong text-primary"><Icon width="19" height="19"/></span><div><p className="text-sm font-bold text-secondary">{label}</p><p className="mt-0.5 text-xl font-black text-primary">{value}</p><p className="mt-0.5 text-xs leading-5 text-secondary">{detail}</p></div></div></article>;
}

export default function DashboardView({ now, history, monthlyStats, totals, dueByGame, drawOverview, onGenerate, onAddExternal, onOpenPlays, onCheckAll, checking, installPrompt }) {
  const draws = useMemo(() => Object.keys(GAMES).map(gameId => ({ gameId, ...getNextDrawInfo(gameId, now) })).sort((a, b) => new Date(a.drawDateTimeISO) - new Date(b.drawDateTimeISO)), [now]);
  const next = draws[0];
  const nextGame = getGameConfig(next.gameId);
  const dueTotal = Object.values(dueByGame).reduce((sum, count) => sum + count, 0);
  const recent = history.slice(0, 3);
  const nextData = drawOverview.games?.[next.gameId] || {};

  return (
    <div className="mx-auto max-w-[1380px] space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-sm font-bold text-indigo-700">Dashboard</p><h1 className="mt-1 text-3xl font-black tracking-tight text-primary">Le tue giocate e le prossime estrazioni</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Controlla cosa richiede attenzione e crea una nuova giocata quando ti serve.</p></div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-secondary"><span className="rounded-full bg-muted px-3 py-2">Ultima sincronizzazione: {drawOverview.loading ? 'in corso…' : drawOverview.fetchedAt ? formatSyncTime(drawOverview.fetchedAt) : 'non disponibile'}</span>{drawOverview.error && <button type="button" onClick={drawOverview.reload} className="rounded-full bg-amber-100 px-3 py-2 text-amber-900">Riprova</button>}</div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <article className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white md:p-8">
          <div className="absolute -right-14 -top-16 h-52 w-52 rounded-full bg-indigo-500/20 blur-2xl"/>
          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold text-indigo-200">Prossima estrazione</p><h2 className="mt-2 text-3xl font-black">{nextGame.name}</h2><p className="mt-2 text-lg font-bold">tra {formatCountdown(next.drawDateTimeISO, now)}</p></div><div className="rounded-2xl bg-white/10 px-4 py-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-300">{nextGame.id === 'primitiva' ? 'Bote stimato' : 'Premio massimo'}</p><p className="mt-1 text-xl font-black">{jackpotLabel(nextData, nextGame)}</p></div></div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/[0.08] p-4"><p className="flex items-center gap-2 text-sm text-slate-300"><CalendarIcon width="18" height="18"/>Data</p><p className="mt-2 font-black capitalize">{formatDrawDate(next.drawDateTimeISO, { includeYear: false })}</p></div><div className="rounded-2xl bg-white/[0.08] p-4"><p className="flex items-center gap-2 text-sm text-slate-300"><ClockIcon width="18" height="18"/>Puoi giocare fino alle</p><p className="mt-2 font-black">{formatDrawTime(next.salesCloseISO)}</p></div><div className="rounded-2xl bg-white/[0.08] p-4"><p className="text-sm text-slate-300">Risultati generalmente dalle</p><p className="mt-2 font-black">{formatDrawTime(next.resultPublicationISO)}</p></div></div>
            <button type="button" onClick={dueTotal > 0 ? onCheckAll : () => onGenerate(next.gameId)} disabled={checking} className={`mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-black sm:w-auto ${dueTotal > 0 ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' : 'bg-white text-slate-950 hover:bg-slate-100'} disabled:opacity-60`}>{dueTotal > 0 ? <><RefreshIcon className={checking ? 'animate-spin' : ''} width="18" height="18"/>{checking ? 'Controllo in corso…' : `Controlla ${dueTotal} ${dueTotal === 1 ? 'giocata' : 'giocate'}`}</> : <><PlusIcon width="18" height="18"/>Crea una giocata per {nextGame.shortName}</>}</button>
            <p className="mt-4 text-xs leading-5 text-slate-400">Orari in Europe/Madrid. Prima dell’acquisto verifica sempre la chiusura sul canale autorizzato.</p>
          </div>
        </article>

        <aside className="rounded-3xl border border-default bg-surface p-5 md:p-6">
          <p className="text-sm font-bold text-indigo-700">Prossima azione</p>
          {dueTotal > 0 ? <><h2 className="mt-2 text-2xl font-black text-primary">{dueTotal} {dueTotal === 1 ? 'giocata da verificare' : 'giocate da verificare'}</h2><p className="mt-2 text-sm leading-6 text-secondary">Sono disponibili estrazioni da confrontare con le tue colonne.</p><p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">Usa il pulsante principale per controllarle tutte insieme.</p></> : <><h2 className="mt-2 text-2xl font-black text-primary">Tutto aggiornato</h2><p className="mt-2 text-sm leading-6 text-secondary">Non ci sono giocate che richiedono un controllo in questo momento.</p><button type="button" onClick={onAddExternal} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-default px-5 text-sm font-black text-primary hover:bg-muted"><EditIcon width="18" height="18"/>Aggiungi una schedina</button></>}
          <button type="button" onClick={onOpenPlays} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50">Apri le mie giocate<ArrowRightIcon width="17" height="17"/></button>
          {installPrompt?.canInstall && <button type="button" onClick={installPrompt.install} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-secondary hover:bg-muted"><InstallIcon width="18" height="18"/>Installa Primy</button>}
        </aside>
      </section>

      <section className="grid rounded-2xl border border-default bg-surface px-5 sm:grid-cols-4 sm:divide-x sm:divide-default sm:py-1">
        <SummaryItem label="Spesa del mese" value={euro.format(monthlyStats.spent)} detail={`${monthlyStats.plays} giocate registrate`} icon={WalletIcon}/>
        <SummaryItem label="Premi del mese" value={euro.format(monthlyStats.won)} detail="Importi ufficiali conosciuti" icon={ChartIcon}/>
        <SummaryItem label="Da verificare" value={dueTotal} detail={dueTotal ? 'Azione richiesta' : 'Tutto aggiornato'} icon={RefreshIcon}/>
        <SummaryItem label="Colonne totali" value={totals.columns} detail={`${totals.plays} giocate acquistate`} icon={TicketIcon}/>
      </section>

      <section>
        <div><h2 className="text-xl font-black text-primary">Calendario dei giochi</h2><p className="mt-1 text-sm text-secondary">Chiusura vendite, sorteggio e disponibilità del risultato sono mostrati separatamente.</p></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {draws.map(draw => { const game = getGameConfig(draw.gameId); const data = drawOverview.games?.[draw.gameId] || {}; return <article key={draw.gameId} className="rounded-2xl border border-default bg-surface p-5"><div className="flex items-start justify-between gap-4"><div><p className={`text-sm font-bold ${draw.gameId === 'primitiva' ? 'text-emerald-700' : 'text-violet-700'}`}>{game.name}</p><p className="mt-2 text-2xl font-black text-primary">{jackpotLabel(data, game)}</p><p className="mt-2 text-sm capitalize text-secondary">{formatDrawDate(draw.drawDateTimeISO, { includeYear: false })}</p></div><span className="rounded-full bg-muted px-3 py-2 text-xs font-bold text-secondary">{draw.gameId === next.gameId ? 'Prossima' : 'Successiva'}</span></div><dl className="mt-5 grid grid-cols-3 gap-3 border-t border-default pt-4 text-sm"><div><dt className="text-secondary">Vendite fino alle</dt><dd className="mt-1 font-black text-primary">{formatDrawTime(draw.salesCloseISO)}</dd></div><div><dt className="text-secondary">Estrazione</dt><dd className="mt-1 font-black text-primary">{formatDrawTime(draw.drawDateTimeISO)}</dd></div><div><dt className="text-secondary">Risultati dalle</dt><dd className="mt-1 font-black text-primary">{formatDrawTime(draw.resultPublicationISO)}</dd></div></dl></article>; })}
        </div>
      </section>

      <section className="rounded-2xl border border-default bg-surface p-5 md:p-6">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-black text-primary">Ultime giocate</h2><p className="mt-1 text-sm text-secondary">Le tre attività più recenti.</p></div><button type="button" onClick={onOpenPlays} className="min-h-11 rounded-xl px-4 text-sm font-black text-indigo-700 hover:bg-indigo-50">Vedi tutte</button></div>
        {recent.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-default p-8 text-center"><p className="font-bold text-primary">Non hai ancora salvato giocate</p><p className="mt-1 text-sm text-secondary">Crea una giocata o aggiungi una schedina acquistata altrove.</p></div> : <div className="mt-5 divide-y divide-default">{recent.map(play => <button type="button" key={play.id} onClick={onOpenPlays} className="grid min-h-16 w-full grid-cols-[1fr_auto] items-center gap-4 py-4 text-left hover:bg-muted"><div><p className="font-black text-primary">{getGameConfig(play.gameId).name} · {play.columns.length} {play.columns.length === 1 ? 'colonna' : 'colonne'}</p><p className="mt-1 text-sm capitalize text-secondary">{formatDrawDate(play.drawDateISO, { short: true })} · {euro.format(playCost(play))}{play.status === 'checked' ? ` · premi ${euro.format(playKnownPrize(play))}` : ''}</p></div><TicketStatus status={play.computedStatus}/></button>)}</div>}
      </section>
    </div>
  );
}
