import React, { useMemo } from 'react';
import { GAMES, getGameConfig } from '../utils/gameConfig.js';
import { formatDrawDate, formatDrawTime, formatSyncTime, getNextDrawInfo } from '../utils/drawSchedule.js';
import { playCost, playKnownPrize } from '../utils/playModel.js';
import { TicketStatus } from './TicketUI.jsx';
import { PrimyMascotGraphic, EmptyTicketGraphic } from './BrandVisuals.jsx';
import { ArrowRightIcon, CalendarIcon, EditIcon, RefreshIcon, TicketIcon, WalletIcon } from './Icons.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function GameCard({ draw, onSelect }) {
  const game = getGameConfig(draw.gameId);
  const isPrimitiva = game.id === 'primitiva';
  const theme = isPrimitiva
    ? {
        card: 'border-primy-200 bg-gradient-to-br from-primy-800 via-primy-700 to-primy-600 text-white',
        chip: 'bg-white/20 text-white',
        button: 'bg-white text-primy-800 hover:bg-primy-50',
        ball: 'bg-white text-primy-800',
        subtle: 'text-primy-50',
      }
    : {
        card: 'border-violet-200 bg-gradient-to-br from-violet-800 via-eurodreams to-violet-500 text-white',
        chip: 'bg-white/20 text-white',
        button: 'bg-white text-violet-800 hover:bg-violet-50',
        ball: 'bg-violet-100 text-violet-800',
        subtle: 'text-violet-50',
      };
  const samples = isPrimitiva ? [6, 14, 23, 31, 38, 45] : [2, 9, 18, 25, 32, 39];

  return (
    <article className={`group relative min-h-[360px] overflow-hidden rounded-[2rem] border p-6 shadow-soft ${theme.card}`}>
      <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" aria-hidden="true"/>
      <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-black/10" aria-hidden="true"/>
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.chip}`}>{euro.format(game.price)} por columna</span>
          <TicketIcon width="26" height="26" className="opacity-85"/>
        </div>
        <div className="mt-8">
          <p className={`text-sm font-semibold ${theme.subtle}`}>Tu próxima combinación</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{game.name}</h2>
          <p className={`mt-3 max-w-md text-sm leading-6 ${theme.subtle}`}>{game.numbersToPick} números del 1 al {game.numberPoolMax} + {game.extra.label.toLowerCase()}.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2" aria-hidden="true">
          {samples.map((number, index) => <span key={number} className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-bold shadow-sm ${index === samples.length - 1 ? 'bg-gold text-primary' : theme.ball}`}>{number}</span>)}
        </div>
        <div className="mt-auto pt-7">
          <div className="flex items-center gap-3 text-sm">
            <CalendarIcon width="18" height="18" className="shrink-0 opacity-85"/>
            <span className="font-medium capitalize">{formatDrawDate(draw.drawDateTimeISO, { includeYear: false })} · {formatDrawTime(draw.drawDateTimeISO)}</span>
          </div>
          <button type="button" onClick={() => onSelect(game.id)} className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold shadow-sm ${theme.button}`} aria-label={`Elige ${game.name} y continúa con la generación`}>
            Crear jugada<ArrowRightIcon width="18" height="18"/>
          </button>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value, detail, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-primy-100 bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primy-100 text-primy-800"><Icon width="19" height="19"/></span>
        <span className="text-xs font-semibold uppercase tracking-wide text-secondary">{label}</span>
      </div>
      <p className="mt-5 font-display text-2xl font-semibold text-primary">{value}</p>
      <p className="mt-1 text-xs leading-5 text-secondary">{detail}</p>
    </div>
  );
}

export default function DashboardView({ now, history, monthlyStats, totals, dueByGame, drawOverview, onGenerate, onAddExternal, onOpenPlays, onCheckAll, checking }) {
  const draws = useMemo(() => ['primitiva', 'eurodreams'].filter(gameId => GAMES[gameId]).map(gameId => ({ gameId, ...getNextDrawInfo(gameId, now) })), [now]);
  const dueTotal = Object.values(dueByGame).reduce((sum, count) => sum + count, 0);
  const recent = history.slice(0, 3);
  const hasPlays = history.length > 0;
  const primaryDraw = draws[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-primy-200 bg-gradient-to-br from-primy-50 via-surface to-cream p-6 dark:from-primy-950 dark:via-surface dark:to-surface shadow-soft sm:p-8">
        <div className="grid items-center gap-7 lg:grid-cols-[1fr_.9fr]">
          <div className="relative z-10">
            <p className="inline-flex rounded-full bg-primy-100 px-3 py-1.5 text-xs font-semibold text-primy-800">Nueva jugada</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-primary sm:text-5xl">Tu próxima jugada empieza aquí.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-secondary">Elige el juego, ajusta tu presupuesto y deja que Primy prepare combinaciones coordinadas para ti.</p>
            {primaryDraw && <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-primy-800"><CalendarIcon width="18" height="18"/>Próximo sorteo: <span className="capitalize">{formatDrawDate(primaryDraw.drawDateTimeISO, { includeYear: false })}</span> a las {formatDrawTime(primaryDraw.drawDateTimeISO)}</p>}
            <button type="button" onClick={() => onGenerate('primitiva')} className="mt-6 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-primy-700 px-6 py-3 font-semibold text-white shadow-soft hover:bg-primy-800">Crear jugada<ArrowRightIcon width="18" height="18"/></button>
          </div>
          <PrimyMascotGraphic className="mx-auto w-full max-w-lg" size="dashboard" caption="Hola, soy Primy"/>
        </div>
      </section>

      {dueTotal > 0 && (
        <section className="flex flex-col gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Jugadas pendientes de comprobación">
          <div><p className="font-display text-lg font-semibold text-amber-950">Tienes {dueTotal} {dueTotal === 1 ? 'jugada por comprobar' : 'jugadas por comprobar'}</p><p className="mt-1 text-sm leading-6 text-amber-900">Los sorteos ya se han celebrado. Puedes revisar los resultados ahora.</p></div>
          <button type="button" onClick={onCheckAll} disabled={checking} className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-amber-900 px-5 text-sm font-semibold text-white hover:bg-amber-950 disabled:opacity-60"><RefreshIcon className={checking ? 'animate-spin' : ''} width="18" height="18"/>{checking ? 'Comprobando…' : 'Comprobar resultados'}</button>
        </section>
      )}

      <section aria-labelledby="game-choice-title">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-primy-700">Elige tu juego</p><h2 id="game-choice-title" className="mt-1 text-2xl font-semibold tracking-tight text-primary">Dos experiencias, un mismo control</h2></div></div>
        <div className="grid gap-5 md:grid-cols-2">{draws.map(draw => <GameCard key={draw.gameId} draw={draw} onSelect={onGenerate}/>)}</div>
      </section>

      {!hasPlays ? (
        <section className="primy-panel grid items-center gap-6 p-6 sm:grid-cols-[180px_1fr_auto]">
          <EmptyTicketGraphic className="mx-auto h-36 w-44"/>
          <div><p className="font-display text-xl font-semibold text-primary">¿Ya tienes un boleto?</p><p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Añádelo manualmente y Primy te recordará cuándo comprobarlo.</p></div>
          <button type="button" onClick={onAddExternal} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-primy-200 bg-surface px-5 text-sm font-semibold text-primy-800 hover:bg-primy-50"><EditIcon width="18" height="18"/>Añadir boleto</button>
        </section>
      ) : (
        <section className="primy-panel p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-primy-700">Tus jugadas</p><h2 className="mt-1 text-2xl font-semibold text-primary">Situación actual</h2></div><button type="button" onClick={onOpenPlays} className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-primy-700 hover:bg-primy-50">Ver todas<ArrowRightIcon width="17" height="17"/></button></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><Stat label="Gasto del mes" value={euro.format(monthlyStats.spent)} detail={`${monthlyStats.plays} jugadas registradas`} icon={WalletIcon}/><Stat label="Por comprobar" value={dueTotal} detail={dueTotal ? 'Requiere atención' : 'Todo actualizado'} icon={RefreshIcon}/><Stat label="Columnas" value={totals.columns} detail={`${totals.plays} jugadas`} icon={TicketIcon}/></div>
          <div className="mt-6 border-t border-default pt-2">{recent.map(play => <button type="button" key={play.id} onClick={onOpenPlays} className="grid min-h-16 w-full grid-cols-[1fr_auto] items-center gap-4 rounded-xl border-b border-default px-2 py-4 text-left last:border-b-0 hover:bg-primy-50"><div><p className="font-semibold text-primary">{getGameConfig(play.gameId).name} · {play.columns.length} {play.columns.length === 1 ? 'columna' : 'columnas'}</p><p className="mt-1 text-sm capitalize text-secondary">{formatDrawDate(play.drawDateISO, { short: true })} · {euro.format(playCost(play))}{play.status === 'checked' ? ` · premios ${euro.format(playKnownPrize(play))}` : ''}</p></div><TicketStatus status={play.computedStatus}/></button>)}</div>
        </section>
      )}

      <details className="group rounded-3xl border border-default bg-surface">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-semibold text-primary"><span>Horarios de los próximos sorteos</span><span className="text-sm text-primy-700 group-open:hidden">Mostrar</span><span className="hidden text-sm text-primy-700 group-open:inline">Ocultar</span></summary>
        <div className="border-t border-default px-5 pb-5"><div className="divide-y divide-default">{draws.map(draw => { const game = getGameConfig(draw.gameId); return <div key={draw.gameId} className="grid gap-3 py-4 sm:grid-cols-[1fr_repeat(3,auto)] sm:items-center sm:gap-7"><div><p className="font-semibold text-primary">{game.name}</p><p className="mt-1 text-sm capitalize text-secondary">{formatDrawDate(draw.drawDateTimeISO, { includeYear: false })}</p></div><div><p className="text-xs font-semibold text-secondary">Cierre</p><p className="mt-1 font-semibold text-primary">{formatDrawTime(draw.salesCloseISO)}</p></div><div><p className="text-xs font-semibold text-secondary">Sorteo</p><p className="mt-1 font-semibold text-primary">{formatDrawTime(draw.drawDateTimeISO)}</p></div><div><p className="text-xs font-semibold text-secondary">Resultados</p><p className="mt-1 font-semibold text-primary">{formatDrawTime(draw.resultPublicationISO)}</p></div></div>; })}</div></div>
      </details>

      <footer className="flex flex-col gap-2 border-t border-default pt-5 text-xs leading-5 text-secondary sm:flex-row sm:items-center sm:justify-between"><p>Primy no vende boletos ni garantiza premios. Solo para mayores de edad.</p><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${drawOverview.loading ? 'bg-slate-400' : drawOverview.error ? 'bg-amber-500' : 'bg-primy-500'}`}/><span>{drawOverview.loading ? 'Actualizando datos…' : drawOverview.fetchedAt ? `Datos actualizados ${formatSyncTime(drawOverview.fetchedAt)}` : 'Datos externos no disponibles'}</span>{drawOverview.error && <button type="button" onClick={drawOverview.reload} className="font-semibold text-primy-700">Reintentar</button>}</div></footer>
    </div>
  );
}
