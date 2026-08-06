import React, { useMemo, useState } from 'react';
import AccessibleDialog from './AccessibleDialog.jsx';
import { ShieldIcon } from './Icons.jsx';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';
import { todayIso, verifyMinimumAge } from '../utils/ageVerification.js';

export default function AgeVerificationDialog({ open, onConfirm, onReject }) {
  const [birthDate, setBirthDate] = useState('');
  const [responsibleUse, setResponsibleUse] = useState(false);
  const [error, setError] = useState('');
  const [underage, setUnderage] = useState(false);
  const maxDate = useMemo(() => todayIso(), []);

  const submit = event => {
    event.preventDefault();
    setError('');
    const result = verifyMinimumAge(birthDate, 18);
    if (!result.valid) {
      setError(result.reason === 'future' ? 'La fecha de nacimiento no puede estar en el futuro.' : 'Introduce una fecha de nacimiento válida.');
      return;
    }
    if (!result.eligible) {
      setUnderage(true);
      return;
    }
    if (!responsibleUse) {
      setError('Debes aceptar el uso responsable para continuar.');
      return;
    }
    onConfirm?.({ confirmedAt: new Date().toISOString() });
  };

  return (
    <AccessibleDialog open={open} onClose={() => {}} labelledBy="age-verification-title" className="sm:max-w-xl" closeOnBackdrop={false}>
      {underage ? (
        <div className="text-center">
          <PrimyMascotGraphic className="mx-auto w-full max-w-[230px]" variant="responsible" size="dashboard" compact showCaption={false}/>
          <p className="mt-3 text-sm font-bold text-primy-700">Acceso restringido</p>
          <h2 id="age-verification-title" className="mt-2 text-2xl font-semibold text-primary">Primy es solo para mayores de 18 años</h2>
          <p className="mt-3 text-sm leading-6 text-secondary">No puedes crear, guardar ni comprobar jugadas desde esta cuenta. La fecha introducida no se ha guardado.</p>
          <button type="button" onClick={onReject} className="mt-6 min-h-12 w-full rounded-2xl bg-primy-700 px-5 font-semibold text-white hover:bg-primy-800">Cerrar sesión</button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="flex items-start gap-3">
            <span className="primy-action-icon" aria-hidden="true"><ShieldIcon width="21" height="21"/></span>
            <div>
              <p className="text-sm font-bold text-primy-700">Comprobación obligatoria</p>
              <h2 id="age-verification-title" className="mt-1 text-2xl font-semibold text-primary">Confirma que eres mayor de edad</h2>
            </div>
          </div>

          <p id="age-verification-description" className="mt-4 text-sm leading-6 text-secondary">Primy está destinada exclusivamente a personas de 18 años o más. La fecha se utiliza en este dispositivo solo para calcular tu edad; no guardamos tu fecha de nacimiento.</p>

          <label className="mt-5 block text-sm font-semibold text-primary">
            Fecha de nacimiento
            <span className="mt-2 flex w-full min-w-0 rounded-2xl border border-default bg-surface px-4 py-3">
              <input
                type="date"
                value={birthDate}
                max={maxDate}
                onChange={event => { setBirthDate(event.target.value); setError(''); }}
                aria-describedby="age-verification-description"
                required
                className="block w-full min-w-0 border-0 bg-transparent p-0 text-base text-primary"
              />
            </span>
          </label>

          <label className="mt-5 flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm leading-6 text-primary">
            <input type="checkbox" checked={responsibleUse} onChange={event => { setResponsibleUse(event.target.checked); setError(''); }} className="mt-1 h-5 w-5 shrink-0 accent-primy-700"/>
            <span>Confirmo que usaré Primy de forma recreativa y responsable. Primy no vende boletos, no predice resultados ni garantiza premios.</span>
          </label>

          {error && <p role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-900">{error}</p>}

          <button type="submit" className="mt-6 min-h-12 w-full rounded-2xl bg-primy-700 px-5 font-semibold text-white hover:bg-primy-800">Verificar y continuar</button>
          <p className="mt-3 text-center text-xs leading-5 text-secondary">Se guarda únicamente la confirmación y la fecha en que la realizaste.</p>
        </form>
      )}
    </AccessibleDialog>
  );
}
