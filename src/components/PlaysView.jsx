import React, { useMemo } from 'react';
import { formatDrawDate } from '../utils/drawSchedule.js';
import { getGameConfig } from '../utils/gameConfig.js';
import TicketHistory from './TicketHistory.jsx';
import GameIdentity from './GameIdentity.jsx';
import { EditIcon, RefreshIcon, TicketIcon } from './Icons.jsx';
import { TicketStatus } from './TicketUI.jsx';

function PendingPlays({ plays, checkingGame, checkingPlayId, onCheckPlay }) {
  const pending = useMemo(() => plays
    .filter(play => ['scheduled', 'awaiting_check'].includes(play.computedStatus))
    .sort((a, b) => String(b.createdAt || b.drawDateISO || '').localeCompare(String(a.createdAt || a.drawDateISO || ''))), [plays]);

  if (!pending.length) return null;

  return (
    <section className="primy-pending-plays" aria-labelledby="pending-plays-title">
      <div className="primy-pending-plays__heading">
        <div>
          <p>Atención</p>
          <h2 id="pending-plays-title">Jugadas pendientes recientes</h2>
          <span>Aquí aparecen todas tus jugadas pendientes, no solo la última.</span>
        </div>
        <strong>{pending.length}</strong>
      </div>
      <div className="primy-pending-plays__list">
        {pending.map(play => {
          const game = getGameConfig(play.gameId);
          const checking = String(checkingPlayId || '') === String(play.id);
          return (
            <article key={play.id} className="primy-pending-play-card">
              <div className="primy-pending-play-card__identity">
                <GameIdentity gameId={play.gameId} size="sm" label={false}/>
                <div className="min-w-0">
                  <h3>{game.name}</h3>
                  <p>{formatDrawDate(play.drawDateISO)} · {play.columns?.length || 1} {(play.columns?.length || 1) === 1 ? 'columna' : 'columnas'}</p>
                </div>
              </div>
              <div className="primy-pending-play-card__actions">
                <TicketStatus status={play.computedStatus}/>
                {play.computedStatus === 'awaiting_check' && typeof onCheckPlay === 'function' && (
                  <button type="button" onClick={() => onCheckPlay(play)} disabled={Boolean(checkingGame || checkingPlayId)} className="primy-check-play-button primy-check-play-button--compact">
                    <RefreshIcon className={checking ? 'animate-spin' : ''} width="16" height="16"/>
                    {checking ? 'Comprobando…' : 'Comprobar ahora'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function PlaysView({ plays, dueByGame, verificationError, checkingGame, checkingPlayId, onCheck, onCheckPlay, onPurchase, onRemove, onSetPrize, onFavorite, onRepeat, onVariant, onAddExternal, onCreate }) {
  const dueEntries = Object.entries(dueByGame).filter(([, count]) => count > 0);
  return (
    <div className="primy-page-enter mx-auto max-w-[1380px] space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="primy-archive-page-header">
        <div className="primy-archive-page-header__icon" aria-hidden="true"><TicketIcon width="24" height="24"/></div>
        <div className="min-w-0 flex-1"><p>Archivo</p><h1>Tus jugadas cuentan una historia.</h1><span>Encuentra primero lo que necesita atención y conserva cada boleto con su identidad.</span></div>
        <button type="button" onClick={onAddExternal} className="ds-button ds-button--primary ds-button--md"><EditIcon width="18" height="18"/>Añadir boleto</button>
      </header>

      <PendingPlays plays={plays} checkingGame={checkingGame} checkingPlayId={checkingPlayId} onCheckPlay={onCheckPlay}/>

      {dueEntries.length > 0 && (
        <section className="primy-archive-due">
          <div><strong>Resultados disponibles</strong><span>Estas jugadas ya pueden comprobarse.</span></div>
          <div>{dueEntries.map(([gameId, count]) => <button type="button" key={gameId} onClick={() => onCheck(gameId)} disabled={Boolean(checkingGame || checkingPlayId)}><GameIdentity gameId={gameId} size="sm" label={false}/><RefreshIcon className={checkingGame === gameId ? 'animate-spin' : ''} width="16" height="16"/>{checkingGame === gameId ? 'Comprobando…' : `${getGameConfig(gameId).shortName} · ${count}`}</button>)}</div>
        </section>
      )}
      {verificationError && <div role="alert" className="primy-generator__error">{verificationError}</div>}
      <TicketHistory plays={plays} checkingGame={checkingGame} checkingPlayId={checkingPlayId} onCheckPlay={onCheckPlay} onCreate={onCreate} onAddExternal={onAddExternal} onPurchase={onPurchase} onRemove={onRemove} onSetPrize={onSetPrize} onFavorite={onFavorite} onRepeat={onRepeat} onVariant={onVariant}/>
    </div>
  );
}
