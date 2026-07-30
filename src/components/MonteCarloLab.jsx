import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getGameConfig } from '../utils/gameConfig.js';

const OPTIONS = [2_000, 20_000, 100_000];
const TIMEOUT_MS = 30_000;
const numberFormat = new Intl.NumberFormat('es-ES');

export default function MonteCarloLab({ gameId }) {
  const [draws, setDraws] = useState(20_000);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const workerRef = useRef(null);
  const timeoutRef = useRef(null);
  const game = getGameConfig(gameId);

  const stopWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  useEffect(() => stopWorker, [stopWorker]);

  const cancel = useCallback(() => {
    stopWorker();
    setRunning(false);
    setProgress(0);
    setError('Simulación cancelada.');
  }, [stopWorker]);

  const run = useCallback(() => {
    stopWorker();
    setRunning(true);
    setResult(null);
    setProgress(0);
    setError('');

    const worker = new Worker(new URL('../workers/monteCarlo.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    const fail = message => {
      stopWorker();
      setRunning(false);
      setProgress(0);
      setError(message);
    };

    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') setProgress(Math.min(0.98, Number(data.value) || 0));
      if (data.type === 'done') {
        stopWorker();
        setResult(data.result);
        setRunning(false);
        setProgress(1);
      }
    };
    worker.onerror = event => fail(event?.message || 'No se ha podido iniciar la simulación en este navegador.');
    timeoutRef.current = window.setTimeout(() => fail('La simulación está tardando demasiado y se ha detenido de forma segura.'), TIMEOUT_MS);
    worker.postMessage({ mode: 'experiment', totalDraws: draws, poolMax: game.numberPoolMax, pick: game.numbersToPick, topK: 10 });
  }, [draws, game.numberPoolMax, game.numbersToPick, stopWorker]);

  const max = result ? Math.max(...result.freqAll) : 0;

  return (
    <section className="rounded-3xl border border-default bg-surface p-5 sm:p-6" aria-busy={running}>
      <p className="text-xs font-bold uppercase tracking-[.14em] text-secondary">Laboratorio Monte Carlo</p>
      <h2 className="mt-2 text-xl font-semibold text-primary">Comprueba cómo se comporta el azar</h2>
      <p className="mt-2 text-sm leading-6 text-secondary">Los números más frecuentes en una muestra no adquieren capacidad para predecir la siguiente extracción.</p>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-primary">Número de extracciones</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              disabled={running}
              aria-pressed={draws === option}
              onClick={() => { setDraws(option); setResult(null); setError(''); }}
              className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${draws === option ? 'border-primy-700 bg-primy-700 text-white' : 'border-default text-primary hover:bg-muted'} disabled:opacity-50`}
            >
              {numberFormat.format(option)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <button type="button" onClick={run} disabled={running} className="min-h-12 rounded-xl bg-primy-700 px-5 font-semibold text-white hover:bg-primy-800 disabled:opacity-50">
          {running ? `Simulando · ${Math.round(progress * 100)}%` : `Simular ${numberFormat.format(draws)} extracciones`}
        </button>
        {running && <button type="button" onClick={cancel} className="min-h-12 rounded-xl border border-default px-5 font-semibold text-primary hover:bg-muted">Cancelar</button>}
      </div>

      {running && (
        <div className="mt-3" role="progressbar" aria-label="Progreso de la simulación" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primy-600" style={{ width: `${Math.max(2, progress * 100)}%` }}/></div>
        </div>
      )}
      {error && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{error}</p>}

      {result && (
        <div className="mt-5 space-y-4" aria-live="polite">
          <div>
            <div className="flex h-24 items-end gap-px rounded-xl bg-muted p-1" aria-label="Frecuencia observada de cada número">
              {result.freqAll.map((count, index) => <div key={index} title={`${index + 1}: ${count}`} className="min-w-px flex-1 rounded-t bg-primy-500" style={{ height: `${max ? (count / max) * 100 : 0}%` }}/>) }
            </div>
            <p className="mt-2 text-xs leading-5 text-secondary">Las diferencias visibles son oscilaciones normales alrededor de una distribución uniforme.</p>
          </div>
          <div className="rounded-2xl bg-muted p-4 text-sm leading-6 text-primary">
            <p>Números más frecuentes en la primera muestra: <strong>{result.hotNumbers.join(', ')}</strong></p>
            <p className="mt-2">Tasa esperada posterior: <strong>{(result.expectedHotHitRate * 100).toFixed(2)}%</strong> · observada: <strong>{(result.observedHotHitRate * 100).toFixed(2)}%</strong></p>
            <p className="mt-2 text-xs text-secondary">Diferencia {result.diffPct >= 0 ? '+' : ''}{result.diffPct.toFixed(1)}%. No representa poder predictivo.</p>
          </div>
        </div>
      )}
    </section>
  );
}
