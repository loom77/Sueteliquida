import React from 'react';

export function NumberBall({ children, extra = false, hit = false, compact = false }) {
  const size = compact ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-base';
  const tone = extra ? 'number-ball-extra border-amber-300 text-amber-950' : hit ? 'number-ball border-primy-500 text-primy-950 ring-2 ring-primy-200' : 'number-ball border-primy-200 text-primy-900';
  const label = extra ? `Número extra ${children}` : hit ? `Número ${children}, extraído` : `Número ${children}`;
  return <span aria-label={label} className={`inline-flex ${size} primy-reveal items-center justify-center rounded-full border font-display font-bold tabular-nums ${tone}`}>{children}</span>;
}

export function TicketStatus({ status }) {
  const map = {
    draft: ['Borrador', 'border-slate-200 bg-slate-50 text-slate-700', '○'],
    scheduled: ['Pendiente', 'border-blue-200 bg-blue-50 text-blue-800', '◷'],
    awaiting_check: ['Por comprobar', 'border-amber-200 bg-amber-50 text-amber-900', '!'],
    checked: ['Comprobada', 'border-primy-200 bg-primy-50 text-primy-800', '✓'],
  };
  const [label, tone, icon] = map[status] || ['Estado', 'border-default bg-muted-strong text-primary', '•'];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${tone}`}><span aria-hidden="true">{icon}</span>{label}</span>;
}
