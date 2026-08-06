import React from 'react';
import AccessibleDialog from './AccessibleDialog.jsx';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';
import { CheckIcon, InfoIcon, ShieldIcon, SparklesIcon, XIcon } from './Icons.jsx';

const CORE_STEPS = [
  {
    icon: InfoIcon,
    title: 'Analiza y ordena',
    text: 'Interpreta las reglas del juego, calcula el coste y organiza la jugada para que todo quede claro desde el primer vistazo.',
  },
  {
    icon: SparklesIcon,
    title: 'Usa un motor inteligente de análisis avanzado',
    text: 'Combina inteligencia artificial, modelos estadísticos, simulaciones Monte Carlo, análisis histórico y lógica de validación para preparar cada columna con rapidez y coherencia.',
  },
  {
    icon: CheckIcon,
    title: 'Comprueba y acompaña',
    text: 'Conecta la generación con la revisión del boleto y la comprobación de premios para que puedas seguir todo desde Primy.',
  },
];

export default function PrimyCoreDialog({ open, onClose }) {
  return (
    <AccessibleDialog
      open={open}
      onClose={onClose}
      labelledBy="primy-core-dialog-title"
      className="primy-core-dialog max-w-3xl"
    >
      <div id="primy-core-info-dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primy-700">El corazón de Primy</p>
            <h2 id="primy-core-dialog-title" className="mt-2 text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              Descubre cómo funciona Primy Core
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary sm:text-base">
              Primy Core es el corazón operativo de Primy: usa IA para organizar y explicar, y combina inteligencia artificial, métodos estadísticos, simulaciones Monte Carlo, análisis histórico y reglas de validación para ayudarte a preparar jugadas válidas, consultar información y comprobar premios desde un mismo lugar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-default bg-surface text-primary hover:bg-muted"
            aria-label="Cerrar información sobre Primy Core"
          >
            <XIcon width="20" height="20" />
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-3">
            {CORE_STEPS.map(step => {
              const StepIcon = step.icon;
              return (
                <div key={step.title} className="primy-core-step">
                  <span className="primy-core-step__icon" aria-hidden="true">
                    <StepIcon width="20" height="20" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-primary">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-secondary">{step.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="primy-core-dialog__mascot primy-core-dialog__mascot--feature">
            <div className="primy-core-dialog__mascot-art">
              <PrimyMascotGraphic variant="helper" size="dashboard" compact showCaption={false} className="w-full" />
            </div>
            <div className="primy-core-dialog__speech">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primy-700">Primy te lo pone fácil</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-primary">
                Tú eliges el juego y el presupuesto. Yo preparo la jugada, te ayudo a revisarla y después sigo contigo para comprobarla.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-primy-200 bg-primy-50/80 p-4">
            <p className="flex items-center gap-2 font-semibold text-primy-900">
              <CheckIcon width="18" height="18" />Lo que sí hace
            </p>
            <p className="mt-2 text-sm leading-6 text-primy-900/80">
              Aplica reglas, calcula costes, ejecuta análisis estadísticos y simulaciones Monte Carlo, y deja cada jugada lista para revisar.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-sky-950">
              <InfoIcon width="18" height="18" />Lo que automatiza
            </p>
            <p className="mt-2 text-sm leading-6 text-sky-950/80">
              Se conecta automáticamente para consultar sorteos y comprobar premios cuando la fuente oficial está disponible.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-amber-950">
              <ShieldIcon width="18" height="18" />Lo que nunca promete
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-950/80">
              No asegura ninguna ganancia, no compra boletos y no puede garantizar premios ni resultados futuros.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-default pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-secondary">
            Primy Core usa inteligencia artificial, automatización, estadística y simulaciones Monte Carlo como apoyo. Las estadísticas son informativas y nunca aseguran una ganancia.
          </p>
          <button type="button" onClick={onClose} className="primy-button primy-button-primary">
            Entendido, seguir preparando
          </button>
        </div>
      </div>
    </AccessibleDialog>
  );
}
