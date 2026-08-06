import React from 'react';
import { Button, Card, Eyebrow } from './DesignSystem.jsx';
import { PrimyMascot } from './PrimyMascot.jsx';

export const GENERATION_THINKING_STEPS = Object.freeze([
  'Revisando las reglas del juego…',
  'Comprobando el coste y tus límites…',
  'Preparando la combinación…',
  'Haciendo la última revisión…',
]);

export function ThinkingProgress({
  activeStep = 0,
  progress = 0,
  onCancel,
  title = 'Primy está preparando tu jugada',
  className = '',
}) {
  const safeStep = Math.max(0, Math.min(GENERATION_THINKING_STEPS.length - 1, activeStep));
  const safeProgress = Math.max(0, Math.min(100, progress));
  return (
    <Card tone="feature" padding="lg" className={`primy-thinking-progress ${className}`} aria-live="polite" aria-busy="true">
      <div className="primy-thinking-progress__mascot">
        <PrimyMascot role="thinking" size="dashboard" compact showCaption={false} />
      </div>
      <div className="primy-thinking-progress__content">
        <Eyebrow>Preparación Primy</Eyebrow>
        <h2 className="primy-thinking-progress__title">{title}</h2>
        <p className="primy-thinking-progress__message">{GENERATION_THINKING_STEPS[safeStep]}</p>
        <div className="primy-thinking-progress__track" aria-hidden="true">
          <span className="primy-thinking-progress__bar" style={{ width: `${safeProgress}%` }} />
        </div>
        <p className="sr-only">Progreso: {Math.round(safeProgress)}%</p>
        {onCancel && <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>}
      </div>
    </Card>
  );
}
