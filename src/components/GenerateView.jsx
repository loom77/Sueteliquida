import React, { useEffect, useRef } from 'react';
import GeneratorPanel from './GeneratorPanel.jsx';
import TicketPreview from './TicketPreview.jsx';

export default function GenerateView(props) {
  const resultRef = useRef(null);

  useEffect(() => {
    if (!props.latest?.id || !resultRef.current || !window.matchMedia('(max-width: 1279px)').matches) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), 120);
    return () => window.clearTimeout(timer);
  }, [props.latest?.id]);

  return (
    <div className="primy-page-enter mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <p className="inline-flex rounded-full bg-primy-100 px-3 py-1.5 text-xs font-semibold text-primy-800">Crear jugada</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-primary sm:text-4xl">Diseña tu próxima combinación</h1>
        <p className="mt-3 text-base leading-7 text-secondary">Has elegido <strong className="text-primary">{props.game.name}</strong>. Ajusta tu presupuesto y Primy hará el resto.</p>
      </header>
      <div className={props.latest ? 'grid items-start gap-6 xl:grid-cols-[0.78fr_1.22fr]' : 'max-w-3xl'}>
        <GeneratorPanel {...props}/>
        {props.latest && <div ref={resultRef} id="generated-ticket" className="scroll-mt-24"><TicketPreview play={props.latest} game={props.game} saveState={props.saveState} onSaveDraft={props.onSaveDraft} onPurchase={props.onPurchase} onRegenerate={props.onGenerate} onDiscard={props.onDiscard} onOpenPlays={props.onOpenPlays} onToast={props.onToast}/></div>}
      </div>
    </div>
  );
}
