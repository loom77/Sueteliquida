import React, { useState } from 'react';
import AccessibleDialog from './AccessibleDialog.jsx';
import { DatabaseIcon, PlusIcon, ShieldIcon, TicketIcon, XIcon } from './Icons.jsx';

const STEPS = [
  { icon: PlusIcon, title: 'Crea colonne coordinate', text: 'Scegli il gioco e il budget. Primy riduce duplicazioni e sovrapposizioni senza promettere numeri certi.' },
  { icon: TicketIcon, title: 'Registra solo ciò che giochi', text: 'Una combinazione resta temporanea finché non la salvi come bozza o la segni come schedina acquistata.' },
  { icon: DatabaseIcon, title: 'Controlla i risultati', text: 'Quando l’estrazione è pubblicata, Primy confronta tutte le colonne con i dati disponibili.' },
  { icon: ShieldIcon, title: 'I dati restano sul dispositivo', text: 'Non serve un account. Puoi esportare un backup e impostare un limite mensile personale.' },
];

export default function OnboardingDialog({ open, onComplete }) {
  const [step, setStep] = useState(0);
  const item = STEPS[step];
  const Icon = item.icon;
  const finish = () => { setStep(0); onComplete?.(); };

  return (
    <AccessibleDialog open={open} onClose={finish} labelledBy="onboarding-title" className="sm:max-w-xl" closeOnBackdrop={false}>
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold text-indigo-700">Benvenuto in Primy</p><h2 id="onboarding-title" className="mt-1 text-2xl font-black text-primary">Un assistente, non un venditore di schedine</h2></div>
        <button type="button" onClick={finish} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted" aria-label="Chiudi introduzione"><XIcon/></button>
      </div>
      <div className="mt-7 rounded-3xl bg-muted p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon width="22" height="22"/></span>
        <h3 className="mt-5 text-xl font-black text-primary">{item.title}</h3>
        <p className="mt-2 text-base leading-7 text-secondary">{item.text}</p>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex gap-2" aria-label={`Passaggio ${step + 1} di ${STEPS.length}`}>{STEPS.map((_, index) => <span key={index} className={`h-2 rounded-full ${index === step ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-300'}`}/>)}</div>
        <div className="flex gap-2">
          {step > 0 && <button type="button" onClick={() => setStep(current => current - 1)} className="min-h-11 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted">Indietro</button>}
          <button type="button" onClick={() => step === STEPS.length - 1 ? finish() : setStep(current => current + 1)} className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800">{step === STEPS.length - 1 ? 'Inizia' : 'Continua'}</button>
        </div>
      </div>
    </AccessibleDialog>
  );
}
