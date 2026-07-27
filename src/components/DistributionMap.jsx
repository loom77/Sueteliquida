import React, { useMemo } from 'react';

export default function DistributionMap({ play, game }) {
  const counts = useMemo(() => {
    const output = Array.from({ length: game.numberPoolMax + 1 }, () => 0);
    for (const column of play?.columns || []) for (const number of column.numbers) output[number] += 1;
    return output;
  }, [play, game.numberPoolMax]);

  const maximum = Math.max(1, ...counts);
  const covered = counts.filter(Boolean).length;

  return (
    <section className="rounded-2xl border border-default bg-surface p-4 md:p-5" aria-labelledby="distribution-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 id="distribution-title" className="font-black text-primary">Distribuzione delle colonne</h3>
          <p className="mt-1 text-sm leading-6 text-secondary">Mostra quante volte compare ogni numero. Non rappresenta una probabilità di estrazione.</p>
        </div>
        <p className="text-sm font-bold text-indigo-700">{covered}/{game.numberPoolMax} numeri coperti</p>
      </div>
      <div className="mt-4 grid grid-cols-8 gap-1.5 sm:grid-cols-10" role="list" aria-label="Frequenza dei numeri nelle colonne">
        {counts.slice(1).map((count, index) => {
          const number = index + 1;
          const intensity = count ? 0.16 + (count / maximum) * 0.72 : 0;
          return (
            <div
              key={number}
              role="listitem"
              aria-label={`Numero ${number}: presente ${count} ${count === 1 ? 'volta' : 'volte'}`}
              className="relative flex aspect-square items-center justify-center rounded-lg border border-default text-xs font-black text-primary"
              style={count ? { backgroundColor: `color-mix(in srgb, var(--primy-accent) ${Math.round(intensity * 100)}%, transparent)` } : undefined}
            >
              {number}
              {count > 1 && <span className="absolute right-0.5 top-0.5 rounded bg-slate-950 px-1 text-xs leading-4 text-white">{count}</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
