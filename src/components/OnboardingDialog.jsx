import React, { useState } from 'react';
import AccessibleDialog from './AccessibleDialog.jsx';
import { DatabaseIcon, PlusIcon, ShieldIcon, TicketIcon, XIcon } from './Icons.jsx';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';

const STEPS = [
  { icon: PlusIcon, mascot: 'helper', title: 'Crea columnas coordinadas', text: 'Elige el juego y el presupuesto. Primy reduce duplicados y solapamientos sin prometer números seguros.' },
  { icon: TicketIcon, mascot: 'thinking', title: 'Registra solo lo que juegas', text: 'Una combinación es temporal hasta que la guardas como borrador o la marcas como boleto comprado.' },
  { icon: DatabaseIcon, mascot: 'celebration', title: 'Comprueba los resultados', text: 'Cuando se publica el sorteo, Primy compara todas las columnas con los datos disponibles.' },
  { icon: ShieldIcon, mascot: 'responsible', title: 'Tus datos quedan vinculados a tu cuenta', text: 'Primy sincroniza tus jugadas de forma privada. Cada usuario solo puede acceder a sus propios datos y los cambios sin conexión se envían al recuperar internet.' },
];

export default function OnboardingDialog({ open, onComplete }) {
  const [step, setStep] = useState(0);
  const item = STEPS[step];
  const Icon = item.icon;
  const finish = () => { setStep(0); onComplete?.(); };

  return (
    <AccessibleDialog open={open} onClose={finish} labelledBy="onboarding-title" className="sm:max-w-2xl" closeOnBackdrop={false}>
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold text-primy-700">Bienvenido a Primy</p><h2 id="onboarding-title" className="mt-1 text-2xl font-semibold text-primary">Un asistente, no un vendedor de boletos</h2></div>
        <button type="button" onClick={finish} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted" aria-label="Cerrar introducción"><XIcon/></button>
      </div>
      <div className="mt-6 grid items-center gap-5 sm:grid-cols-[220px_minmax(0,1fr)]">
        <PrimyMascotGraphic className="mx-auto w-full max-w-[220px]" variant={item.mascot} size="dashboard" compact showCaption={false}/>
        <div className="rounded-3xl bg-muted p-5 sm:p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primy-700 text-white"><Icon width="22" height="22"/></span>
          <h3 className="mt-5 text-xl font-semibold text-primary">{item.title}</h3>
          <p className="mt-2 text-base leading-7 text-secondary">{item.text}</p>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex gap-2" aria-label={`Paso ${step + 1} de ${STEPS.length}`}>{STEPS.map((_, index) => <span key={index} className={`h-2 rounded-full ${index === step ? 'w-8 bg-primy-700' : 'w-2 bg-slate-300'}`}/>)}</div>
        <div className="flex gap-2">
          {step > 0 && <button type="button" onClick={() => setStep(current => current - 1)} className="min-h-11 rounded-2xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted">Atrás</button>}
          <button type="button" onClick={() => step === STEPS.length - 1 ? finish() : setStep(current => current + 1)} className="min-h-11 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800">{step === STEPS.length - 1 ? 'Empezar' : 'Continuar'}</button>
        </div>
      </div>
    </AccessibleDialog>
  );
}
