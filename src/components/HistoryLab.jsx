import React from 'react';
import { DatabaseIcon, RefreshIcon, ShieldIcon } from './Icons.jsx';

export default function HistoryLab({ historyState }) {
  const { loading, loaded, error, notice, analysis, source, limited, reload, load } = historyState;
  const totalDraws = analysis?.totalDraws || 0;

  return (
    <section className="rounded-2xl border border-default bg-surface p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">Datos históricos</h2>
          <p className="mt-1 text-sm leading-6 text-secondary">Estos datos son opcionales y se muestran únicamente para explorar sorteos pasados. No intervienen en la creación de tus jugadas.</p>
        </div>
        <button type="button" onClick={loaded ? reload : load} disabled={loading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted disabled:opacity-60">
          <RefreshIcon className={loading ? 'animate-spin' : ''} width="17" height="17"/>
          {loading ? 'Cargando…' : loaded ? 'Actualizar datos' : 'Cargar datos'}
        </button>
      </div>

      {!loaded && !loading && (
        <div className="mt-5 rounded-xl bg-muted p-4">
          <p className="font-semibold text-primary">Sin carga automática</p>
          <p className="mt-1 text-sm leading-6 text-secondary">Para acelerar el panel y reducir las solicitudes al proveedor, el historial solo se descarga cuando generas una jugada o pulsas «Cargar datos».</p>
        </div>
      )}

      {error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{error}</div>}
      {notice && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{notice}</div>}

      {(loaded || loading) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted p-4"><DatabaseIcon className="text-primy-700" width="20" height="20"/><p className="mt-3 text-sm font-bold text-primary">Sorteos disponibles</p><p className="mt-1 text-2xl font-semibold text-primary">{loading ? '—' : totalDraws}</p></div>
          <div className="rounded-xl bg-muted p-4"><ShieldIcon className="text-emerald-700" width="20" height="20"/><p className="mt-3 text-sm font-bold text-primary">Decisión automática</p><p className="mt-1 text-lg font-semibold text-primary">{loading ? 'Análisis pendiente' : totalDraws ? 'Lectura descriptiva' : 'Sin datos'}</p></div>
          <div className="rounded-xl bg-muted p-4"><DatabaseIcon className="text-amber-700" width="20" height="20"/><p className="mt-3 text-sm font-bold text-primary">Disponibilidad</p><p className="mt-1 text-lg font-semibold text-primary">{loading ? 'Carga' : limited ? 'Historial limitado' : totalDraws ? 'Historial disponible' : 'No disponible'}</p></div>
        </div>
      )}

      <details className="mt-5 rounded-xl border border-default p-4">
        <summary className="cursor-pointer text-sm font-bold text-primary">Mostrar detalles técnicos</summary>
        <div className="mt-3 space-y-3 text-sm leading-6 text-secondary">
          <p>Primy puede calcular métricas descriptivas y comparar modelos experimentales para auditar el comportamiento del historial. Estas pruebas se mantienen separadas de Primy Core y no cambian los números generados.</p>
          <p>Los sorteos pasados no hacen que un número esté «pendiente» ni convierten una lotería aleatoria en un sistema predecible.</p>
          <p>Fuente: {source || 'sin cargar'}.</p>
        </div>
      </details>
    </section>
  );
}
