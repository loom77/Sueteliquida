import React from 'react';
import { getGameConfig } from '../utils/gameConfig.js';
import TicketHistory from './TicketHistory.jsx';
import GameIdentity from './GameIdentity.jsx';
import { EditIcon, RefreshIcon, TicketIcon } from './Icons.jsx';

export default function PlaysView({ plays, dueByGame, verificationError, checkingGame, onCheck, onPurchase, onRemove, onSetPrize, onFavorite, onRepeat, onVariant, onAddExternal, onCreate }) {
  const dueEntries = Object.entries(dueByGame).filter(([, count]) => count > 0);
  return (
    <div className="primy-page-enter mx-auto max-w-[1380px] space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="primy-archive-page-header">
        <div className="primy-archive-page-header__icon" aria-hidden="true"><TicketIcon width="24" height="24"/></div>
        <div className="min-w-0 flex-1"><p>Archivo</p><h1>Tus jugadas cuentan una historia.</h1><span>Encuentra primero lo que necesita atención y conserva cada boleto con su identidad.</span></div>
        <button type="button" onClick={onAddExternal} className="ds-button ds-button--primary ds-button--md"><EditIcon width="18" height="18"/>Añadir boleto</button>
      </header>

      {dueEntries.length > 0 && (
        <section className="primy-archive-due">
          <div><strong>Resultados disponibles</strong><span>Estas jugadas ya pueden comprobarse.</span></div>
          <div>{dueEntries.map(([gameId, count]) => <button type="button" key={gameId} onClick={() => onCheck(gameId)} disabled={Boolean(checkingGame)}><GameIdentity gameId={gameId} size="sm" label={false}/><RefreshIcon className={checkingGame === gameId ? 'animate-spin' : ''} width="16" height="16"/>{checkingGame === gameId ? 'Comprobando…' : `${getGameConfig(gameId).shortName} · ${count}`}</button>)}</div>
        </section>
      )}
      {verificationError && <div role="alert" className="primy-generator__error">{verificationError}</div>}
      <TicketHistory plays={plays} onCreate={onCreate} onAddExternal={onAddExternal} onPurchase={onPurchase} onRemove={onRemove} onSetPrize={onSetPrize} onFavorite={onFavorite} onRepeat={onRepeat} onVariant={onVariant}/>
    </div>
  );
}
