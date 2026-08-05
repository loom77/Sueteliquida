import React from 'react';
import { AlertIcon, RefreshIcon, ShieldIcon } from './Icons.jsx';

const STYLES = {
  available: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  updating: 'border-amber-200 bg-amber-50 text-amber-950',
  unavailable: 'border-rose-200 bg-rose-50 text-rose-950',
  'no-active-round': 'border-amber-200 bg-amber-50 text-amber-950',
  invalid: 'border-rose-200 bg-rose-50 text-rose-950',
  closed: 'border-slate-200 bg-slate-50 text-slate-900',
  finished: 'border-slate-200 bg-slate-50 text-slate-900',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-950',
};

export default function RoundAvailabilityNotice({ availability, loading = false, onRefresh, compact = false }) {
  if (!availability || availability.operational) return null;
  const Icon = ['updating', 'no-active-round', 'closed', 'finished'].includes(availability.state) ? ShieldIcon : AlertIcon;
  return (
    <section className={`rounded-2xl border ${compact ? 'p-4' : 'p-5'} ${STYLES[availability.state] || STYLES.unavailable}`} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <Icon width="21" height="21" className="mt-0.5 shrink-0" aria-hidden="true"/>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{availability.title}</h3>
          <p className="mt-1 text-sm leading-6 opacity-90">{availability.message}</p>
          {availability.reasons?.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs leading-5 opacity-80">
              {availability.reasons.slice(0, 4).map(reason => <li key={reason}>• {reason}</li>)}
            </ul>
          )}
        </div>
      </div>
      {typeof onRefresh === 'function' && (
        <button type="button" onClick={onRefresh} disabled={loading} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-current/20 bg-white/80 px-4 text-sm font-semibold disabled:opacity-60">
          <RefreshIcon width="17" height="17" className={loading ? 'animate-spin' : ''}/>
          {loading ? 'Actualizando…' : 'Actualizar datos'}
        </button>
      )}
    </section>
  );
}
