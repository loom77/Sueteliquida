import React from 'react';
import { getGameConfig } from '../utils/gameConfig.js';
import TicketHistory from './TicketHistory.jsx';
import { EditIcon, RefreshIcon } from './Icons.jsx';

export default function PlaysView({ plays, dueByGame, verificationError, checkingGame, onCheck, onPurchase, onRemove, onSetPrize, onFavorite, onRepeat, onVariant, onAddExternal }) {
  const dueEntries = Object.entries(dueByGame).filter(([, count]) => count > 0);
  return (
    <div className="primy-page-enter mx-auto max-w-[1380px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-primy-700">Mis jugadas</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-primary">Boletos, borradores y resultados</h1><p className="mt-2 text-sm leading-6 text-secondary">Todo lo que has creado o comprado, con acciones rápidas para repetir y crear variantes.</p></div><button type="button" onClick={onAddExternal} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800"><EditIcon width="18" height="18"/>Añadir boleto</button></div>
      {dueEntries.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="text-lg font-semibold text-amber-950">Resultados disponibles</h2><p className="mt-1 text-sm leading-6 text-amber-900">Comprueba solo los juegos cuyos sorteos ya se han celebrado.</p><div className="mt-4 flex flex-wrap gap-3">{dueEntries.map(([gameId, count]) => <button type="button" key={gameId} onClick={() => onCheck(gameId)} disabled={Boolean(checkingGame)} className="flex min-h-11 items-center gap-2 rounded-xl bg-amber-900 px-4 text-sm font-semibold text-white hover:bg-amber-950 disabled:opacity-60"><RefreshIcon className={checkingGame === gameId ? 'animate-spin' : ''} width="17" height="17"/>{checkingGame === gameId ? 'Comprobando…' : `Comprobar ${getGameConfig(gameId).shortName} (${count})`}</button>)}</div></section>}
      {verificationError && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{verificationError}</div>}
      <TicketHistory plays={plays} onPurchase={onPurchase} onRemove={onRemove} onSetPrize={onSetPrize} onFavorite={onFavorite} onRepeat={onRepeat} onVariant={onVariant}/>
    </div>
  );
}
