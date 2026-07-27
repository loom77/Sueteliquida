import React from 'react';
import GeneratorPanel from './GeneratorPanel.jsx';
import TicketPreview from './TicketPreview.jsx';

export default function GenerateView(props) {
  return (
    <div className="mx-auto max-w-[1380px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-sm font-bold text-indigo-700">Genera</p><h1 className="mt-1 text-3xl font-black tracking-tight text-primary">Una giocata coordinata, senza pannelli complicati</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">Imposta colonne o budget. Primy si occupa della distribuzione e mostra chiaramente cosa ha costruito.</p></div>
        <p className="rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800">1–20 colonne · nessun salvataggio automatico</p>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <GeneratorPanel {...props}/>
        <TicketPreview play={props.latest} game={props.game} saveState={props.saveState} onSaveDraft={props.onSaveDraft} onPurchase={props.onPurchase} onRegenerate={props.onGenerate} onDiscard={props.onDiscard} onOpenPlays={props.onOpenPlays} onToast={props.onToast}/>
      </div>
    </div>
  );
}
