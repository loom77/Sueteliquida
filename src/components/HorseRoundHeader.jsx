import React from 'react';
import { AlertIcon, CalendarIcon, RefreshIcon } from './Icons.jsx';

const date = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

export default function HorseRoundHeader({ gameName, round, availability, loading, error, onRefresh }) {
  const roundDate = round?.roundDate ? new Date(`${round.roundDate}T12:00:00Z`) : null;
  return (
    <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-orange-800">Programa oficial SELAE</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em] text-primary">
            {round ? `${gameName}${round.officialRoundNumber ? ` · Jornada ${round.officialRoundNumber}` : ''}` : loading ? 'Cargando programa oficial' : availability?.title || 'Programa oficial no disponible'}
          </h2>
          {roundDate && <p className="mt-2 flex items-center gap-2 text-sm text-secondary"><CalendarIcon width="17" height="17"/>{date.format(roundDate)}{round.venue ? ` · ${round.venue}` : ''}</p>}
          {round && <p className="mt-2 text-xs text-secondary">Revisión {round.revision} · composición vinculada a la fuente oficial</p>}
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-900 hover:bg-orange-100 disabled:opacity-60">
          <RefreshIcon width="17" height="17" className={loading ? 'animate-spin' : ''}/>{loading ? 'Actualizando' : 'Actualizar'}
        </button>
      </div>
      {error && <div role="alert" className="mt-4 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"><AlertIcon width="20" height="20" className="mt-0.5 shrink-0"/><p>{error}</p></div>}
      {round?.validation?.warnings?.length > 0 && <p className="mt-4 text-xs leading-5 text-secondary">Algunos datos complementarios todavía no están publicados. Primy conserva la composición disponible y su revisión.</p>}
    </div>
  );
}
