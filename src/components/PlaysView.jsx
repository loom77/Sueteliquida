import React, { useMemo } from 'react';
import { formatDrawDate } from '../utils/drawSchedule.js';
import { getGameConfig } from '../utils/gameConfig.js';
import TicketHistory from './TicketHistory.jsx';
import GameIdentity from './GameIdentity.jsx';
import { TicketStatus } from './TicketUI.jsx';
import { EditIcon, RefreshIcon, TicketIcon } from './Icons.jsx';

function playTimestamp(play) {
  const value = play?.createdAt || play?.updatedAt || play?.drawDateISO || '';
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function PendingRecentPlays({ plays, checkingGame, checkingPlayId, onCheckPlay }) {
  const pendingPlays = useMemo(() => (
    (Array.isArray(plays) ? plays : [])
      .filter(play => play?.computedStatus === 'scheduled' || play?.computedStatus === 'awaiting_check')
      .sort((a, b) => playTimestamp(b) - playTimestamp(a))
  ), [plays]);

  if (pendingPlays.length === 0) return null;

  return (
    <section className="primy-pending-recent" aria-labelledby="pending-recent-title">
      <div className="primy-pending-recent__header">
        <div>
          <p>Seguimiento</p>
          <h2 id="pending-recent-title">Jugadas pendientes recientes</h2>
        </div>
        <span className="primy-pending-recent__count" aria-label={`${pendingPlays.length} jugadas pendientes`}>
          {pendingPlays.length}
        </span>
      </div>

      <div className="primy-pending-recent__list">
        {pendingPlays.map(play => {
          const game = getGameConfig(play.gameId);
          const checking = String(checkingPlayId || '') === String(play.id);
          const otherCheckRunning = Boolean(checkingGame || (checkingPlayId && !checking));
          const canCheck = play.computedStatus === 'awaiting_check' && typeof onCheckPlay === 'function';

          return (
            <article className="primy-pending-recent__item" key={play.id}>
              <div className="primy-pending-recent__identity">
                <GameIdentity gameId={play.gameId} size="sm" label={false}/>
                <div>
                  <strong>{game.shortName || game.name}</strong>
                  <span>{play.drawName || 'Próximo sorteo'} · {formatDrawDate(play.drawDateISO)}</span>
                </div>
              </div>

              <TicketStatus status={play.computedStatus}/>

              {canCheck && (
                <button
                  type="button"
                  className="primy-pending-recent__check"
                  onClick={() => onCheckPlay(play)}
                  disabled={checking || otherCheckRunning}
                  aria-label={`Comprobar ahora la jugada de ${game.name}`}
                >
                  <RefreshIcon width="16" height="16" className={checking ? 'animate-spin' : ''}/>
                  {checking ? 'Comprobando…' : 'Comprobar ahora'}
                </button>
              )}
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

      <PendingRecentPlays
        plays={plays}
        checkingGame={checkingGame}
        checkingPlayId={checkingPlayId}
        onCheckPlay={onCheckPlay}
      />

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
