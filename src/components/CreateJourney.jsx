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
import { CheckIcon, SparklesIcon, TicketIcon } from './Icons.jsx';

const STEPS = [
  { id: 'configure', label: 'Elige' },
  { id: 'create', label: 'Crea' },
  { id: 'result', label: 'Guarda' },
];

function JourneyRail({ activeStep }) {
  return (
    <ol className="primy-journey-rail" aria-label="Progreso de creación">
      {STEPS.map((step, index) => {
        const complete = index < activeStep;
        const active = index === activeStep;
        return (
          <li key={step.id} className={`primy-journey-step ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}>
            <span className="primy-journey-dot" aria-hidden="true">{complete ? <CheckIcon width="15" height="15"/> : index + 1}</span>
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function CreateJourney(props) {
  const resultRef = useRef(null);
  const activeStep = props.latest ? 2 : props.busy ? 1 : 0;
  const journeyCopy = useMemo(() => {
    if (props.latest) return { icon: TicketIcon, eyebrow: 'Tu jugada', title: 'Lista para guardarla', description: 'Revisa el boleto y decide cómo quieres conservarlo.' };
    if (props.busy) return { icon: SparklesIcon, eyebrow: 'Primy Core', title: 'Estamos creando tu jugada', description: 'Solo tardará un momento. No necesitas hacer nada más.' };
    if (props.activeGame === 'loteria-nacional') return { icon: TicketIcon, eyebrow: 'Lotería Nacional', title: 'Prepara tu número de cinco cifras', description: 'Selecciona el sorteo, elige las cifras y guarda el décimo cuando lo hayas comprado.' };
    if (props.activeGame === 'quiniela') return { icon: TicketIcon, eyebrow: 'La Quiniela', title: 'Prepara tu primera apuesta deportiva', description: 'Marca los 14 signos y el Pleno al 15 sobre una composición oficial verificada.' };
    if (props.activeGame === 'quinigol') return { icon: TicketIcon, eyebrow: 'El Quinigol', title: 'Pronostica los goles de seis partidos', description: 'Elige un resultado 0, 1, 2 o M para cada equipo de la jornada oficial.' };
    if (props.activeGame === 'lototurf') return { icon: TicketIcon, eyebrow: 'Lototurf', title: 'Combina números y carrera oficial', description: 'Elige los seis números y el dorsal ganador de la carrera vinculada a la jornada.' };
    if (props.activeGame === 'quintuple-plus') return { icon: TicketIcon, eyebrow: 'Quíntuple Plus', title: 'Prepara tus seis pronósticos hípicos', description: 'Selecciona los ganadores de cinco carreras y el segundo clasificado de la quinta.' };
    return { icon: SparklesIcon, eyebrow: 'Crear', title: 'Tu próxima jugada empieza aquí', description: 'Elige el juego, ajusta las columnas y crea tu boleto en pocos segundos.' };
  }, [props.latest, props.busy, props.activeGame]);

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

      <div className={props.latest ? 'grid min-w-0 items-start gap-6 2xl:grid-cols-[minmax(440px,.82fr)_minmax(620px,1.18fr)]' : 'mx-auto max-w-4xl'}>
        <div className="min-w-0">
          {props.activeGame === 'loteria-nacional'
            ? <NationalLotteryPanel {...props} onPrepareNational={props.onPrepareNational} layout={props.latest ? 'compact' : 'wide'}/>
            : props.activeGame === 'quiniela'
              ? <QuinielaPanel {...props} onPrepareQuiniela={props.onPrepareQuiniela}/>
              : props.activeGame === 'quinigol'
                ? <QuinigolPanel {...props} onPrepareQuinigol={props.onPrepareQuinigol}/>
              : props.activeGame === 'lototurf'
                ? <LototurfPanel {...props} onPrepareLototurf={props.onPrepareLototurf}/>
                : props.activeGame === 'quintuple-plus'
                  ? <QuintuplePlusPanel {...props} onPrepareQuintuplePlus={props.onPrepareQuintuplePlus}/>
                  : <GeneratorPanel {...props} layout={props.latest ? 'compact' : 'wide'}/>
          }
        </div>
        {props.latest && (
          <div ref={resultRef} id="generated-ticket" className="min-w-0 scroll-mt-24">
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
        )}
      </div>
    </div>
  );
}
