import { useCallback, useEffect, useRef, useState } from 'react';

const GENERATION_TIMEOUT_MS = 30_000;
export const MIN_GENERATION_PRESENTATION_MS = 4_000;
const PROGRESS_TICK_MS = 80;

export function useGenerationController({ view }) {
  const [latest, setLatest] = useState(null);
  const [saveState, setSaveState] = useState('unsaved');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationError, setGenerationError] = useState('');
  const workerRef = useRef(null);
  const timeoutRef = useRef(null);
  const revealTimerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const requestRef = useRef(0);
  const startedAtRef = useRef(0);

  const clearSafetyTimeout = useCallback(() => {
    if (!timeoutRef.current) return;
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const clearPresentationTimers = useCallback(() => {
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    revealTimerRef.current = null;
    progressTimerRef.current = null;
  }, []);

  const terminateWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const invalidateRequest = useCallback(() => {
    requestRef.current += 1;
    clearSafetyTimeout();
    clearPresentationTimers();
    terminateWorker();
  }, [clearPresentationTimers, clearSafetyTimeout, terminateWorker]);

  const cancel = useCallback(({ announce = true } = {}) => {
    if (!busy && !workerRef.current && !revealTimerRef.current) return;
    invalidateRequest();
    setBusy(false);
    setProgress(0);
    if (announce) setGenerationError('Generación cancelada. Puedes volver a intentarlo cuando quieras.');
  }, [busy, invalidateRequest]);

  const resetResult = useCallback(() => {
    setLatest(null);
    setSaveState('unsaved');
    setGenerationError('');
    setProgress(0);
  }, []);

  const ensureWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/fusion.worker.js', import.meta.url), { type: 'module' });
    }
    return workerRef.current;
  }, []);

  const generate = useCallback(({ activeGame, columnCount, variantContext, betType = 'simple', systemSize = 7, drawInfo = null }) => {
    invalidateRequest();
    setBusy(true);
    setProgress(0.02);
    setGenerationError('');
    setLatest(null);
    setSaveState('unsaved');

    const requestId = requestRef.current;
    const worker = ensureWorker();
    startedAtRef.current = Date.now();

    progressTimerRef.current = window.setInterval(() => {
      if (requestRef.current !== requestId) return;
      const elapsed = Date.now() - startedAtRef.current;
      const timedProgress = Math.min(0.96, Math.max(0.02, (elapsed / MIN_GENERATION_PRESENTATION_MS) * 0.96));
      setProgress(current => Math.max(current, timedProgress));
    }, PROGRESS_TICK_MS);

    const fail = message => {
      if (requestRef.current !== requestId) return;
      clearSafetyTimeout();
      clearPresentationTimers();
      terminateWorker();
      setBusy(false);
      setProgress(0);
      setGenerationError(message);
    };

    const reveal = play => {
      if (requestRef.current !== requestId) return;
      clearPresentationTimers();
      setProgress(1);
      setLatest(play);
      setBusy(false);
    };

    worker.onmessage = ({ data }) => {
      if (data?.requestId !== requestId || requestRef.current !== requestId) return;
      if (data.type === 'progress') return;
      if (data.type === 'done') {
        clearSafetyTimeout();
        terminateWorker();
        const elapsed = Date.now() - startedAtRef.current;
        const remaining = Math.max(0, MIN_GENERATION_PRESENTATION_MS - elapsed);
        if (remaining === 0) reveal(data.play);
        else revealTimerRef.current = window.setTimeout(() => reveal(data.play), remaining);
        return;
      }
      if (data.type === 'error') fail(data.message || 'No se ha podido generar la jugada.');
    };

    worker.onerror = event => {
      fail(event?.message || 'El método automático no ha podido iniciarse en este navegador.');
    };

    timeoutRef.current = window.setTimeout(() => {
      fail('La generación está tardando demasiado y se ha detenido de forma segura. Inténtalo de nuevo.');
    }, GENERATION_TIMEOUT_MS);

    worker.postMessage({
      requestId,
      gameId: activeGame,
      columnCount,
      avoidColumns: variantContext?.columns || [],
      variantOf: variantContext?.id || null,
      betType,
      systemSize,
      drawInfo,
    });
  }, [clearPresentationTimers, clearSafetyTimeout, ensureWorker, invalidateRequest, terminateWorker]);

  useEffect(() => () => {
    clearSafetyTimeout();
    clearPresentationTimers();
    terminateWorker();
  }, [clearPresentationTimers, clearSafetyTimeout, terminateWorker]);

  useEffect(() => {
    if (view === 'generate' || !busy) return;
    cancel({ announce: false });
  }, [view, busy, cancel]);

  return {
    latest,
    setLatest,
    saveState,
    setSaveState,
    busy,
    progress,
    generationError,
    setGenerationError,
    generate,
    cancel,
    resetResult,
  };
}
