import React, { useEffect, useMemo, useRef } from 'react';
import GeneratorPanel from './GeneratorPanel.jsx';
import TicketPreview from './TicketPreview.jsx';
import NationalLotteryPanel from './NationalLotteryPanel.jsx';
import NationalTicketPreview from './NationalTicketPreview.jsx';
import QuinielaPanel from './QuinielaPanel.jsx';
import QuinielaTicketPreview from './QuinielaTicketPreview.jsx';
import QuinigolPanel from './QuinigolPanel.jsx';
import QuinigolTicketPreview from './QuinigolTicketPreview.jsx';
import LototurfPanel from './LototurfPanel.jsx';
import QuintuplePlusPanel from './QuintuplePlusPanel.jsx';
import HorseTicketPreview from './HorseTicketPreview.jsx';
import { EditIcon, SparklesIcon, TicketIcon } from './Icons.jsx';
import { ProgressSteps } from './DesignSystem.jsx';

const STEPS = [
  { id: 'game', label: 'Juego' },
  { id: 'configure', label: 'Configura' },
  { id: 'create', label: 'Crea' },
  { id: 'review', label: 'Revisa' },
  { id: 'save', label: 'Guarda' },
];

function JourneyRail({ activeStep }) {
  return <ProgressSteps steps={STEPS} current={activeStep} className="primy-journey-rail primy-journey-rail--v18" />;
}

export default function CreateJourney(props) {
  const resultRef = useRef(null);
  const isStored = props.latest && props.saveState && props.saveState !== 'unsaved';
  const activeStep = props.latest ? (isStored ? 4 : 3) : props.busy ? 2 : 1;
  const journeyCopy = useMemo(() => {
    if (props.latest && isStored) return { icon: TicketIcon, eyebrow: 'Todo listo', title: 'Tu jugada está guardada', description: 'Puedes abrir el archivo o preparar una nueva jugada cuando quieras.' };
    if (props.latest) return { icon: TicketIcon, eyebrow: 'Revisión', title: 'Revisa antes de guardar', description: 'Comprueba juego, números, coste y sorteo. Después decide si guardas el borrador o registras el boleto.' };
    if (props.busy) return { icon: SparklesIcon, eyebrow: 'Primy Core', title: 'Estamos creando tu jugada', description: 'Solo tardará un momento. No necesitas hacer nada más.' };
    if (props.activeGame === 'loteria-nacional') return { icon: TicketIcon, eyebrow: 'Lotería Nacional', title: 'Prepara tu número de cinco cifras', description: 'Selecciona el sorteo, elige las cifras y guarda el décimo cuando lo hayas comprado.' };
    if (props.activeGame === 'quiniela') return { icon: TicketIcon, eyebrow: 'La Quiniela', title: 'Prepara tu primera apuesta deportiva', description: 'Marca los 14 signos y el Pleno al 15 sobre una composición oficial verificada.' };
    if (props.activeGame === 'quinigol') return { icon: TicketIcon, eyebrow: 'El Quinigol', title: 'Pronostica los goles de seis partidos', description: 'Elige un resultado 0, 1, 2 o M para cada equipo de la jornada oficial.' };
    if (props.activeGame === 'lototurf') return { icon: TicketIcon, eyebrow: 'Lototurf', title: 'Combina números y carrera oficial', description: 'Elige los seis números y el dorsal ganador de la carrera vinculada a la jornada.' };
    if (props.activeGame === 'quintuple-plus') return { icon: TicketIcon, eyebrow: 'Quíntuple Plus', title: 'Prepara tus seis pronósticos hípicos', description: 'Selecciona los ganadores de cinco carreras y el segundo clasificado de la quinta.' };
    return { icon: SparklesIcon, eyebrow: 'Crear', title: 'Tu próxima jugada empieza aquí', description: 'Elige el juego, ajusta las columnas y crea tu boleto en pocos segundos.' };
  }, [props.latest, props.busy, props.activeGame, isStored]);

  useEffect(() => {
    if (!props.latest?.id || !resultRef.current || !window.matchMedia('(max-width: 1279px)').matches) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), 120);
    return () => window.clearTimeout(timer);
  }, [props.latest?.id]);

  const HeaderIcon = journeyCopy.icon;

  return (
    <div className="primy-create-journey primy-page-enter mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <header className="primy-journey-header">
        <div className="min-w-0">
          <p className="primy-eyebrow">{journeyCopy.eyebrow}</p>
          <div className="mt-4 flex items-start gap-4">
            <span className="primy-journey-header-icon"><HeaderIcon width="23" height="23" aria-hidden="true"/></span>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.045em] text-primary sm:text-4xl">{journeyCopy.title}</h1>
              <p className="mt-2 max-w-2xl text-base leading-7 text-secondary">{journeyCopy.description}</p>
            </div>
          </div>
        </div>
        <JourneyRail activeStep={activeStep}/>
      </header>

      {props.latest ? (
        <section ref={resultRef} id="generated-ticket" className="primy-review-stage scroll-mt-24" aria-labelledby="review-stage-title">
          <div className="primy-review-stage__toolbar">
            <div>
              <p className="primy-eyebrow">Paso 4 de 5</p>
              <h2 id="review-stage-title">Comprueba tu jugada</h2>
              <p>El boleto todavía no está comprado. Revisa todos los datos antes de guardarlo o registrarlo.</p>
            </div>
            {!isStored && (
              <button type="button" className="ds-button ds-button--secondary ds-button--md" onClick={props.onDiscard}>
                <EditIcon width="18" height="18" aria-hidden="true"/>Modificar configuración
              </button>
            )}
          </div>
          <div className="primy-review-stage__ticket">
            {props.activeGame === 'loteria-nacional'
              ? <NationalTicketPreview play={props.latest} saveState={props.saveState} onSaveDraft={props.onSaveDraft} onPurchase={props.onPurchase} onRegenerate={() => props.onPrepareNational?.({})} onDiscard={props.onDiscard} onOpenPlays={props.onOpenPlays} onToast={props.onToast}/>
              : props.activeGame === 'quiniela'
                ? <QuinielaTicketPreview play={props.latest} saveState={props.saveState} onSaveDraft={props.onSaveDraft} onDiscard={props.onDiscard} onOpenPlays={props.onOpenPlays}/>
                : props.activeGame === 'quinigol'
                  ? <QuinigolTicketPreview play={props.latest} saveState={props.saveState} onSaveDraft={props.onSaveDraft} onDiscard={props.onDiscard} onOpenPlays={props.onOpenPlays}/>
                  : ['lototurf', 'quintuple-plus'].includes(props.activeGame)
                    ? <HorseTicketPreview play={props.latest} saveState={props.saveState} onSaveDraft={props.onSaveDraft} onDiscard={props.onDiscard} onOpenPlays={props.onOpenPlays}/>
                    : <TicketPreview play={props.latest} game={props.game} saveState={props.saveState} onSaveDraft={props.onSaveDraft} onPurchase={props.onPurchase} onRegenerate={props.onGenerate} onDiscard={props.onDiscard} onOpenPlays={props.onOpenPlays} onToast={props.onToast}/>
            }
          </div>
        </section>
      ) : (
        <div className="mx-auto max-w-4xl min-w-0">
          {props.activeGame === 'loteria-nacional'
            ? <NationalLotteryPanel {...props} onPrepareNational={props.onPrepareNational} layout="wide"/>
            : props.activeGame === 'quiniela'
              ? <QuinielaPanel {...props} onPrepareQuiniela={props.onPrepareQuiniela}/>
              : props.activeGame === 'quinigol'
                ? <QuinigolPanel {...props} onPrepareQuinigol={props.onPrepareQuinigol}/>
              : props.activeGame === 'lototurf'
                ? <LototurfPanel {...props} onPrepareLototurf={props.onPrepareLototurf}/>
                : props.activeGame === 'quintuple-plus'
                  ? <QuintuplePlusPanel {...props} onPrepareQuintuplePlus={props.onPrepareQuintuplePlus}/>
                  : <GeneratorPanel {...props} layout="wide"/>
          }
        </div>
      )}
    </div>
  );
}
