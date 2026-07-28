import React, { useMemo, useState } from 'react';
import { formatDrawDate } from '../utils/drawSchedule.js';
import { getGameConfig } from '../utils/gameConfig.js';
import { playCost, playKnownPrize } from '../utils/playModel.js';
import { NumberBall, TicketStatus } from './TicketUI.jsx';
import { ChevronDownIcon, CopyIcon, RepeatIcon, SearchIcon, StarIcon, TrashIcon } from './Icons.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function PlayDetails({ play, onPurchase, onRemove, onSetPrize, onFavorite, onRepeat, onVariant }) {
  const game = getGameConfig(play.gameId);
  const winning = new Set(play.result?.winningNumbers || []);
  const receiptScopedExtra = game.extra.scope === 'receipt';
  const receiptExtra = play.receiptExtra ?? play.columns?.[0]?.extra;
  return (
    <div className="p-4 md:p-5">
      {receiptScopedExtra && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Reintegro del resguardo</p><p className="mt-1 text-sm text-amber-950">Único para todas las columnas</p></div>
            <NumberBall compact extra>{receiptExtra}</NumberBall>
          </div>
          {play.receiptPrize && <div className="mt-3 border-t border-amber-200 pt-3 text-sm text-amber-950"><p className="font-black">{play.receiptPrize.category}</p><p>{play.receiptPrize.displayText}</p></div>}
          {play.metadata?.rulesMigrationWarning && <p className="mt-3 text-sm font-bold leading-6 text-rose-800">{play.metadata.rulesMigrationWarning}</p>}
        </div>
      )}
      <div className="grid gap-3 xl:grid-cols-2">
        {play.columns.map((column, index) => (
          <div key={column.id} className="rounded-2xl bg-muted p-4">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-secondary">Columna {index + 1}</p>{column.status === 'checked' && <p className="text-xs font-bold text-secondary">{column.matches || 0} números acertados</p>}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">{column.numbers.map(number => <NumberBall key={number} compact hit={column.status === 'checked' && winning.has(number)}>{number}</NumberBall>)}{!receiptScopedExtra && <><span aria-hidden="true" className="mx-1 h-7 w-px bg-slate-300"/><NumberBall compact extra>{column.extra}</NumberBall><span className="text-sm font-bold text-secondary">{game.extra.label}</span></>}</div>
            {column.status === 'checked' && <div className="mt-3 text-sm leading-6 text-primary"><p className="font-black text-primary">{column.prizeCategory || 'Sin premio'}</p><p>{column.prizeDisplay}</p>{column.prizeCategory && column.officialPrize == null && <label className="mt-3 block font-bold">Premio oficial (€)<input type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal" onBlur={event => event.target.value && onSetPrize(play.id, column.id, event.target.value)}/></label>}</div>}
          </div>
        ))}
      </div>
      {play.metadata?.externalReference && <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-secondary"><strong>Referencia:</strong> {play.metadata.externalReference}</p>}
      <div className="mt-5 flex flex-col gap-3 border-t border-default pt-5">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onFavorite(play.id)} className="flex min-h-11 items-center gap-2 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted"><StarIcon width="17" height="17" className={play.favorite ? 'fill-amber-400 text-amber-500' : ''}/>{play.favorite ? 'Quitar de favoritos' : 'Favorito'}</button>
          <button type="button" onClick={() => onRepeat(play)} className="flex min-h-11 items-center gap-2 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted"><CopyIcon width="17" height="17"/>Repetir números</button>
          <button type="button" onClick={() => onVariant(play)} className="flex min-h-11 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-bold text-violet-800 hover:bg-violet-100"><RepeatIcon width="17" height="17"/>Crear variante</button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {!play.purchased ? <button type="button" onClick={() => onPurchase(play.id)} className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700">He jugado este boleto · {euro.format(playCost(play))}</button> : <p className="text-sm font-semibold text-secondary">Registrada como jugada comprada</p>}
          <button type="button" onClick={() => onRemove(play.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50"><TrashIcon width="17" height="17"/>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

export default function TicketHistory({ plays, onPurchase, onRemove, onSetPrize, onFavorite, onRepeat, onVariant }) {
  const [gameFilter, setGameFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return plays
      .filter(play => gameFilter === 'all' || play.gameId === gameFilter)
      .filter(play => statusFilter === 'all' || play.computedStatus === statusFilter)
      .filter(play => !normalizedQuery || `${getGameConfig(play.gameId).name} ${play.drawDateKey || ''}`.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => sort === 'oldest' ? String(a.createdAt || '').localeCompare(String(b.createdAt || '')) : String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }, [plays, gameFilter, statusFilter, sort, query]);

  const filters = <div className="grid gap-3 rounded-2xl border border-default bg-surface p-4 md:grid-cols-4 md:p-5">
    <label className="text-sm font-bold text-primary">Buscar<span className="mt-2 flex min-h-11 items-center gap-2 rounded-xl border border-default px-3"><SearchIcon width="18" height="18"/><input value={query} onChange={event => setQuery(event.target.value)} className="w-full border-0 bg-transparent p-0 text-sm font-normal outline-none" placeholder="Fecha o juego"/></span></label>
    <label className="text-sm font-bold text-primary">Juego<select value={gameFilter} onChange={event => setGameFilter(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 text-sm font-normal"><option value="all">Todos</option><option value="primitiva">La Primitiva</option><option value="eurodreams">EuroDreams</option></select></label>
    <label className="text-sm font-bold text-primary">Estado<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 text-sm font-normal"><option value="all">Todos</option><option value="draft">Borradores</option><option value="scheduled">Pendientes</option><option value="awaiting_check">Por comprobar</option><option value="checked">Comprobadas</option></select></label>
    <label className="text-sm font-bold text-primary">Orden<select value={sort} onChange={event => setSort(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 text-sm font-normal"><option value="newest">Más recientes</option><option value="oldest">Menos recientes</option></select></label>
  </div>;

  if (!filtered.length) return <section>{filters}<div className="mt-5 rounded-2xl border border-dashed border-default bg-surface p-10 text-center"><p className="font-black text-primary">No se ha encontrado ninguna jugada</p><p className="mt-2 text-sm text-secondary">Cambia los filtros o crea una jugada nueva.</p></div></section>;

  return (
    <section>
      {filters}

      <div className="mt-5 space-y-3 lg:hidden">
        {filtered.map(play => {
          const game = getGameConfig(play.gameId);
          const isExpanded = expanded === play.id;
          const awarded = play.columns.filter(column => column.prizeCategory).length;
          return <article key={play.id} className="rounded-2xl border border-default bg-surface"><button type="button" onClick={() => setExpanded(isExpanded ? null : play.id)} className="grid min-h-20 w-full items-center gap-4 p-4 text-left" aria-expanded={isExpanded}><div><div className="flex items-center gap-2"><p className="font-black text-primary">{game.name}</p>{play.favorite && <StarIcon width="16" height="16" className="fill-amber-400 text-amber-500"/>}</div><p className="mt-1 text-sm capitalize text-secondary">{formatDrawDate(play.drawDateISO)} · {play.columns.length} {play.columns.length === 1 ? 'columna' : 'columnas'}</p></div><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-secondary">{play.status === 'checked' ? `${awarded} premiadas · ${euro.format(playKnownPrize(play))}` : euro.format(playCost(play))}</p></div><div className="flex items-center gap-3"><TicketStatus status={play.computedStatus}/><ChevronDownIcon className={isExpanded ? 'rotate-180' : ''} width="19" height="19"/></div></div></button>{isExpanded && <div className="border-t border-default"><PlayDetails play={play} onPurchase={onPurchase} onRemove={onRemove} onSetPrize={onSetPrize} onFavorite={onFavorite} onRepeat={onRepeat} onVariant={onVariant}/></div>}</article>;
        })}
      </div>

      <div className="mt-5 hidden overflow-hidden rounded-2xl border border-default bg-surface lg:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-muted text-xs uppercase tracking-wide text-secondary"><tr><th className="px-5 py-4">Sorteo</th><th className="px-5 py-4">Juego</th><th className="px-5 py-4">Columnas</th><th className="px-5 py-4">Coste</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Detalles</th></tr></thead>
          <tbody className="divide-y divide-default">
            {filtered.map(play => {
              const game = getGameConfig(play.gameId);
              const isExpanded = expanded === play.id;
              return <React.Fragment key={play.id}><tr className="hover:bg-muted"><td className="px-5 py-4 font-bold capitalize text-primary">{formatDrawDate(play.drawDateISO, { short: true })}</td><td className="px-5 py-4"><div className="flex items-center gap-2 font-black text-primary">{game.name}{play.favorite && <StarIcon width="15" height="15" className="fill-amber-400 text-amber-500"/>}</div></td><td className="px-5 py-4 text-secondary">{play.columns.length}</td><td className="px-5 py-4 font-bold text-primary">{euro.format(playCost(play))}</td><td className="px-5 py-4"><TicketStatus status={play.computedStatus}/>{play.status === 'checked' && <p className="mt-1 text-xs text-secondary">Premios: {euro.format(playKnownPrize(play))}</p>}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setExpanded(isExpanded ? null : play.id)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50" aria-expanded={isExpanded}>{isExpanded ? 'Cerrar' : 'Abrir'}<ChevronDownIcon className={isExpanded ? 'rotate-180' : ''} width="17" height="17"/></button></td></tr>{isExpanded && <tr><td colSpan="6" className="border-t border-default bg-muted/40"><PlayDetails play={play} onPurchase={onPurchase} onRemove={onRemove} onSetPrize={onSetPrize} onFavorite={onFavorite} onRepeat={onRepeat} onVariant={onVariant}/></td></tr>}</React.Fragment>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
