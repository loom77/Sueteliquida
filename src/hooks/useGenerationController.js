import { useCallback, useEffect, useRef, useState } from 'react';

const GENERATION_TIMEOUT_MS = 30_000;

export function useGenerationController({ view }) {
  const [latest, setLatest] = useState(null);
  const [saveState, setSaveState] = useState('unsaved');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationError, setGenerationError] = useState('');
  const workerRef = useRef(null);
  const timeoutRef = useRef(null);
  const requestRef = useRef(0);

  const clearTimeoutRef = useCallback(() => {
    if (!timeoutRef.current) return;
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const terminateWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const invalidateRequest = useCallback(() => {
    requestRef.current += 1;
    clearTimeoutRef();
    terminateWorker();
  }, [clearTimeoutRef, terminateWorker]);

  const cancel = useCallback(({ announce = true } = {}) => {
    if (!busy && !workerRef.current) return;
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

  const generate = useCallback(({ activeGame, columnCount, variantContext, betType = 'simple', systemSize = 7 }) => {
    invalidateRequest();
    setBusy(true);
    setProgress(0.02);
    setGenerationError('');
    setLatest(null);
    setSaveState('unsaved');

    const requestId = requestRef.current;
    const worker = ensureWorker();

    const fail = message => {
      if (requestRef.current !== requestId) return;
      clearTimeoutRef();
      terminateWorker();
      setBusy(false);
      setProgress(0);
      setGenerationError(message);
    };

    worker.onmessage = ({ data }) => {
      if (data?.requestId !== requestId || requestRef.current !== requestId) return;
      if (data.type === 'progress') {
        setProgress(Math.min(0.96, Math.max(0.02, Number(data.progress) || 0)));
        return;
      }
      if (data.type === 'done') {
        clearTimeoutRef();
        terminateWorker();
        setLatest(data.play);
        setProgress(1);
        setBusy(false);
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
    });
  }, [clearTimeoutRef, ensureWorker, invalidateRequest, terminateWorker]);

  useEffect(() => () => {
    clearTimeoutRef();
    terminateWorker();
  }, [clearTimeoutRef, terminateWorker]);

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
