import React from 'react';

export function NumberBall({ children, extra = false, hit = false, compact = false, winning = false, dimmed = false }) {
  const size = compact ? 'number-ball--compact' : 'number-ball--regular';
  const classes = [
    'number-ball-ui',
    size,
    extra && 'number-ball-ui--extra',
    winning && 'number-ball-ui--winning',
    hit && 'number-ball-ui--hit',
    dimmed && !hit && 'number-ball-ui--dimmed',
  ].filter(Boolean).join(' ');
  const numberType = extra ? 'extra' : 'principal';
  const context = winning ? 'del resultado oficial' : 'de tu jugada';
  const label = hit
    ? `Número ${numberType} ${children}, coincide con el resultado oficial`
    : `Número ${numberType} ${children}, ${context}`;

  return (
    <span aria-label={label} className={classes} data-hit={hit ? 'true' : 'false'} data-extra={extra ? 'true' : 'false'}>
      <span className="number-ball-ui__value">{children}</span>
      {hit && <span className="number-ball-ui__match" aria-hidden="true">✓</span>}
    </span>
  );
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
