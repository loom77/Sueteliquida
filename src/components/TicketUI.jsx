import React from 'react';

export function NumberBall({ children, extra = false, hit = false, compact = false }) {
  const size = compact ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-base';
  const tone = extra
    ? 'border-amber-300 bg-amber-100 text-amber-950'
    : hit
      ? 'border-emerald-400 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-200'
      : 'border-default bg-muted text-primary';
  const label = extra ? `Número extra ${children}` : hit ? `Número ${children}, extraído` : `Número ${children}`;
  return <span aria-label={label} className={`inline-flex ${size} items-center justify-center rounded-full border font-black tabular-nums ${tone}`}>{children}</span>;
}

export function TicketStatus({ status }) {
  const map = {
    draft: ['Borrador', 'bg-muted-strong text-primary'],
    scheduled: ['Pendiente', 'bg-blue-50 text-blue-800'],
    awaiting_check: ['Por comprobar', 'bg-amber-50 text-amber-900'],
    checked: ['Comprobada', 'bg-emerald-50 text-emerald-800'],
  };
  const [label, tone] = map[status] || ['Estado', 'bg-muted-strong text-primary'];
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${tone}`}>{label}</span>;
}
