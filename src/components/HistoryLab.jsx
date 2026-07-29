import React from 'react';
import { DatabaseIcon, RefreshIcon, ShieldIcon } from './Icons.jsx';

const updatedFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

export default function HistoryLab({ historyState }) {
  const { loading, loaded, error, warning, notice, analysis, source, limited, latestOnly, stale, savedAt, reload, load } = historyState;
  const totalDraws = analysis?.totalDraws || 0;
  const availability = loading
    ? 'Cargando'
    : latestOnly
      ? 'Solo último sorteo'
      : limited
        ? 'Historial parcial'
        : totalDraws
          ? 'Historial disponible'
          : 'No disponible';

  return (
    <section className="rounded-2xl border border-default bg-surface p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">Datos históricos</h2>
          <p className="mt-1 text-sm leading-6 text-secondary">Son opcionales y sirven únicamente para consultar sorteos pasados. Nunca intervienen en la creación de una jugada.</p>
          {savedAt > 0 && <p className="mt-2 text-xs font-semibold text-secondary">Última copia: {updatedFormat.format(new Date(savedAt))}{stale ? ' · sin actualizar' : ''}</p>}
        </div>
        <button type="button" onClick={loaded ? reload : load} disabled={loading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted disabled:opacity-60">
          <RefreshIcon className={loading ? 'animate-spin' : ''} width="17" height="17"/>
          {loading ? 'Cargando…' : loaded ? 'Actualizar datos' : 'Cargar datos'}
        </button>
      </div>

      {!loaded && !loading && (
        <div className="mt-5 rounded-xl bg-muted p-4">
          <p className="font-semibold text-primary">Carga bajo demanda</p>
          <p className="mt-1 text-sm leading-6 text-secondary">Primy conserva una copia temporal para evitar solicitudes repetidas y reducir los bloqueos del proveedor.</p>
        </div>
      )}

      {error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{error}</div>}
      {warning && <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{warning}</div>}
      {notice && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{notice}</div>}

      {(loaded || loading) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted p-4">
            <DatabaseIcon className="text-primy-700" width="20" height="20"/>
            <p className="mt-3 text-sm font-bold text-primary">Sorteos disponibles</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{loading ? '—' : totalDraws}</p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <ShieldIcon className="text-emerald-700" width="20" height="20"/>
            <p className="mt-3 text-sm font-bold text-primary">Uso en Primy Core</p>
            <p className="mt-1 text-lg font-semibold text-primary">No interviene</p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <DatabaseIcon className="text-amber-700" width="20" height="20"/>
            <p className="mt-3 text-sm font-bold text-primary">Disponibilidad</p>
            <p className="mt-1 text-lg font-semibold text-primary">{availability}</p>
          </div>
        </div>
      )}

      <details className="mt-5 rounded-xl border border-default p-4">
        <summary className="cursor-pointer text-sm font-bold text-primary">Mostrar detalles técnicos</summary>
        <div className="mt-3 space-y-3 text-sm leading-6 text-secondary">
          <p>Primy calcula únicamente métricas descriptivas. Los sorteos pasados no hacen que un número esté «pendiente» y no convierten una lotería aleatoria en un sistema predecible.</p>
          <p>Cuando el proveedor limita el historial, Primy evita repetir consultas y mantiene la última copia válida disponible.</p>
          <p>Fuente: {source || 'sin cargar'}.</p>
        </div>
      </details>
    </section>
  );
}
