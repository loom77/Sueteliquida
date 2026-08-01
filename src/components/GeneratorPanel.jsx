import React, { useEffect, useState } from 'react';
import GameSwitch from './GameSwitch.jsx';
import GameIdentity from './GameIdentity.jsx';
import { ThinkingProgress } from './ThinkingProgress.jsx';
import { AlertIcon, InfoIcon, SparklesIcon } from './Icons.jsx';
import { BudgetCreativeIcon } from './CreativeUiIcon.jsx';
import { BONOLOTO_SYSTEM_SIZES, bonolotoEquivalentBets } from '../utils/bonoloto.js';
import { GORDO_SYSTEM_SIZES, gordoEquivalentBets } from '../utils/gordoPrimitiva.js';
import { gameRuleSummary } from '../utils/gameConfig.js';
import { gameThemeStyle, getGameVisualTheme } from '../utils/gameVisualTheme.js';
import PrimyCoreDialog from './PrimyCoreDialog.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

// Compatibility hooks retained while the old per-game action classes are retired
// from primary CTAs: primy-bonoloto-action · primy-euromillones-action.
const LEGACY_GAME_ACTIONS = {
  bonoloto: 'primy-bonoloto-action',
  euromillones: 'primy-euromillones-action',
  gordoprimitiva: 'primy-gordo-action',
};

export default function GeneratorPanel({
  game, activeGame, onGameChange, columnCount, setColumnCount,
  betType = 'simple', setBetType, systemSize = 7, setSystemSize,
  onGenerate, onCancel, busy, progress = 0, generationError,
  monthlySpent = 0, monthlyLimit = null, variantLabel = '', onClearVariant,
}) {
  const supportsMultiple = Boolean(game.supportsMultiple);
  const isGordo = activeGame === 'gordoprimitiva';
  const isMultiple = supportsMultiple && betType === 'multiple';
  const minColumns = game.minSimpleBets || 1;
  const maxColumns = game.maxSimpleBets || 1;
  const systemSizes = isGordo ? GORDO_SYSTEM_SIZES : BONOLOTO_SYSTEM_SIZES;
  const equivalentBetsFor = isGordo ? gordoEquivalentBets : bonolotoEquivalentBets;
  const equivalentBets = isMultiple ? equivalentBetsFor(systemSize) : columnCount;
  const totalCost = game.price * equivalentBets;
  const hasLimit = monthlyLimit != null && monthlyLimit > 0;
  const remainingBeforePlay = hasLimit ? Math.max(0, monthlyLimit - monthlySpent) : null;
  const remainingAfterPlay = hasLimit ? Math.max(0, monthlyLimit - monthlySpent - totalCost) : null;
  const limitRatio = hasLimit ? Math.min(1, (monthlySpent + totalCost) / monthlyLimit) : 0;
  const exceedsLimit = hasLimit && monthlySpent + totalCost > monthlyLimit;
  const theme = getGameVisualTheme(activeGame);
  const [coreInfoOpen, setCoreInfoOpen] = useState(false);

  useEffect(() => {
    if (supportsMultiple && betType === 'simple' && columnCount < minColumns) setColumnCount(minColumns);
  }, [betType, columnCount, supportsMultiple, minColumns, setColumnCount]);

  const actionLabel = isMultiple
    ? `Preparar múltiple de ${systemSize} números · ${euro.format(totalCost)}`
    : `Preparar ${columnCount === 1 ? 'mi jugada' : `${columnCount} columnas`} · ${euro.format(totalCost)}`;
  const activeStep = Math.min(3, Math.max(0, Math.floor(Math.min(progress, 0.999) * 4)));

  return (
    <section
      className="primy-panel primy-generator primy-card-enter"
      aria-busy={busy}
      style={gameThemeStyle(activeGame)}
      data-game={activeGame}
      data-legacy-action={LEGACY_GAME_ACTIONS[activeGame] || theme.legacyActionClass}
    >
      <div className="primy-core-spotlight primy-core-spotlight--compact">
        <span className="primy-core-spotlight__icon" aria-hidden="true"><SparklesIcon width="20" height="20"/></span>
        <div className="min-w-0 flex-1">
          <p className="primy-core-spotlight__title">Primy Core prepara y valida tu boleto</p>
          <p className="primy-core-spotlight__copy">Reglas, coste y límites reunidos en un único proceso.</p>
        </div>
        <button
          type="button"
          className="primy-core-learn primy-core-learn--compact"
          onClick={() => setCoreInfoOpen(true)}
          aria-haspopup="dialog"
          aria-controls="primy-core-info-dialog"
        >
          <InfoIcon width="17" height="17"/>
          <span>Descubre más sobre Primy Core</span>
        </button>
      </div>

      {variantLabel && (
        <div className="primy-generator__variant">
          <div><p className="font-semibold text-primary">Variante de una jugada existente</p><p className="mt-1 text-sm leading-6 text-secondary">Primy preparará una selección distinta de {variantLabel}.</p></div>
          <button type="button" onClick={onClearVariant} className="ds-button ds-button--ghost ds-button--sm">Quitar referencia</button>
        </div>
      )}

      <div className="primy-generator__picker"><GameSwitch active={activeGame} onChange={onGameChange} label="Elige el juego" disabled={busy}/></div>

      <div key={activeGame} className="primy-generator__selected-game">
        <GameIdentity gameId={activeGame} size="lg"/>
        <div className="min-w-0">
          <p className="primy-generator__selected-label">Boleto seleccionado</p>
          <p className="primy-generator__selected-rule">{gameRuleSummary(game)}</p>
        </div>
      </div>

      {supportsMultiple && (
        <fieldset className="primy-generator__bet-type">
          <legend>Tipo de apuesta</legend>
          <div className="primy-generator__segmented">
            <button type="button" aria-pressed={!isMultiple} onClick={() => setBetType?.('simple')} disabled={busy} data-selected={!isMultiple ? 'true' : 'false'}>Sencilla</button>
            <button type="button" aria-pressed={isMultiple} onClick={() => setBetType?.('multiple')} disabled={busy} data-selected={isMultiple ? 'true' : 'false'}>Múltiple</button>
          </div>
          <p>{activeGame === 'bonoloto' ? 'La sencilla genera de 2 a 8 apuestas. La múltiple amplía la selección y calcula automáticamente las apuestas equivalentes.' : 'La sencilla crea columnas independientes. La múltiple desarrolla una selección ampliada según las reglas oficiales.'}</p>
        </fieldset>
      )}

      <div key={`budget-${activeGame}`} className="primy-generator__budget">
        <div className="primy-generator__budget-heading">
          <span className="primy-generator__budget-icon" aria-hidden="true"><BudgetCreativeIcon /></span>
          <div><p>Presupuesto</p><span>{isMultiple ? `${equivalentBets} apuestas equivalentes` : `${columnCount} ${columnCount === 1 ? 'columna' : 'columnas'}`}</span></div>
          <strong>{euro.format(totalCost)}</strong>
        </div>

        {isMultiple ? (
          <div className="primy-generator__multiple-control">
            <label htmlFor="system-size">Números de la selección múltiple</label>
            <select id="system-size" value={systemSize} onChange={event => setSystemSize?.(Number(event.target.value))} disabled={busy}>
              {(game.multipleSelectionSizes || systemSizes).map(size => <option key={size} value={size}>{size} números · {equivalentBetsFor(size)} apuestas</option>)}
            </select>
            <div className="primy-generator__budget-facts">
              <span><small>Apuestas</small><strong>{equivalentBets}</strong></span>
              <span><small>Coste</small><strong>{euro.format(totalCost)}</strong></span>
            </div>
          </div>
        ) : (
          <div className="primy-generator__stepper">
            <button type="button" onClick={() => setColumnCount(value => Math.max(minColumns, value - 1))} disabled={busy || columnCount <= minColumns} aria-label="Reducir una columna">−</button>
            <div><output aria-live="polite">{columnCount}</output><span>{columnCount === 1 ? 'columna' : 'columnas'} · {euro.format(game.price)} cada una</span></div>
            <button type="button" onClick={() => setColumnCount(value => Math.min(maxColumns, value + 1))} disabled={busy || columnCount >= maxColumns} aria-label="Aumentar una columna">+</button>
          </div>
        )}

        <p className="primy-generator__range">{isMultiple ? 'El coste cambia con el desarrollo oficial de la múltiple.' : `Mínimo ${minColumns}, máximo ${maxColumns} columnas en el mismo boleto.`}</p>

        {hasLimit && (
          <div className="primy-generator__limit" data-exceeded={exceedsLimit ? 'true' : 'false'}>
            <div><span>Límite personal</span><strong>{exceedsLimit ? `Supera el límite por ${euro.format(totalCost - remainingBeforePlay)}` : `${euro.format(remainingAfterPlay)} disponibles después`}</strong></div>
            <span className="primy-generator__limit-track" aria-hidden="true"><span style={{ width: `${Math.max(4, limitRatio * 100)}%` }}/></span>
          </div>
        )}

        {game.secondary && <p className="primy-generator__rule-note">Cada columna incluye {game.numbersToPick} números y {game.secondary.count} {game.secondary.label.toLocaleLowerCase('es-ES')} independientes.</p>}
        {game.extra?.assignment === 'official-receipt' && <p className="primy-generator__rule-note">El reintegro se introduce después, exactamente como aparece en el resguardo comprado.</p>}
        {isGordo && <p className="primy-generator__rule-note">Cada apuesta incluye cinco números y una clave del 0 al 9.</p>}
      </div>

      {busy ? (
        <ThinkingProgress activeStep={activeStep} progress={progress * 100} onCancel={onCancel}/>
      ) : (
        <div className="primy-generator__action-bar">
          <div className="primy-generator__action-copy"><strong>Todo listo</strong><span>Preparar no guarda ni compra el boleto.</span></div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={exceedsLimit}
            aria-label={`Preparar una jugada de ${game.name}`}
            data-game-action={activeGame}
            className="ds-button ds-button--primary ds-button--lg primy-generator__primary-action"
          >
            <SparklesIcon width="20" height="20"/>{actionLabel}
          </button>
        </div>
      )}

      {exceedsLimit && <div className="primy-generator__error" role="alert"><AlertIcon width="20" height="20"/><p>Esta jugada superaría tu límite mensual de <strong>{euro.format(monthlyLimit)}</strong>. Reduce el número de apuestas.</p></div>}
      {generationError && <div className="primy-generator__error" role="alert"><AlertIcon width="20" height="20"/><p>{generationError}</p></div>}

      <PrimyCoreDialog open={coreInfoOpen} onClose={() => setCoreInfoOpen(false)} />
    </section>
  );
}
