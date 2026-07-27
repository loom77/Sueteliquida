import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getGameConfig } from '../utils/gameConfig.js';
import { drawInfoForDate, getNextDrawInfo } from '../utils/drawSchedule.js';
import GameSwitch from './GameSwitch.jsx';
import AccessibleDialog from './AccessibleDialog.jsx';
import { CameraIcon, PlusIcon, TrashIcon, XIcon } from './Icons.jsx';

function emptyColumn() {
  return { id: crypto.randomUUID(), numbers: '', extra: '' };
}

export default function ManualPlayDialog({ open, initialGame = 'primitiva', onClose, onSave }) {
  const [gameId, setGameId] = useState(initialGame);
  const [dateKey, setDateKey] = useState('');
  const [reference, setReference] = useState('');
  const [columns, setColumns] = useState([emptyColumn()]);
  const [receiptExtra, setReceiptExtra] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const game = getGameConfig(gameId);

  const stopScanner = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks?.().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  };

  const close = () => {
    stopScanner();
    onClose?.();
  };

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }
    const next = getNextDrawInfo(initialGame);
    setGameId(initialGame);
    setDateKey(next.drawDateKey);
    setReference('');
    setColumns([emptyColumn()]);
    setReceiptExtra('');
    setError('');
    setScanMessage('');
  }, [open, initialGame]);

  useEffect(() => {
    if (!open) return;
    setDateKey(getNextDrawInfo(gameId).drawDateKey);
    setColumns([emptyColumn()]);
    setReceiptExtra('');
    setError('');
  }, [gameId, open]);

  useEffect(() => () => stopScanner(), []);

  const parsed = useMemo(() => columns.map((column, index) => {
    const numbers = [...new Set(column.numbers.split(/[\s,;.-]+/).map(Number).filter(Number.isInteger))].sort((a, b) => a - b);
    return { ...column, index: index + 1, parsedNumbers: numbers, parsedExtra: Number(column.extra) };
  }), [columns]);

  const startScanner = async () => {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
      setScanMessage('La lettura del codice non è disponibile in questo browser. Inserisci il riferimento manualmente.');
      return;
    }
    try {
      stopScanner();
      setScanMessage('Inquadra il QR o il codice a barre del resguardo.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setScanning(true);
      await new Promise(resolve => requestAnimationFrame(resolve));
      if (!videoRef.current || !streamRef.current) return stopScanner();
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const formats = await window.BarcodeDetector.getSupportedFormats?.().catch(() => []) || [];
      const wanted = formats.filter(format => ['qr_code', 'code_128', 'ean_13', 'ean_8'].includes(format));
      const detector = wanted.length ? new window.BarcodeDetector({ formats: wanted }) : new window.BarcodeDetector();

      const scan = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            setReference(String(codes[0].rawValue).slice(0, 160));
            setScanMessage('Codice acquisito. Verifica e completa i numeri della schedina.');
            stopScanner();
            return;
          }
        } catch { /* continua la lettura */ }
        frameRef.current = requestAnimationFrame(scan);
      };
      frameRef.current = requestAnimationFrame(scan);
    } catch {
      stopScanner();
      setScanMessage('Non è stato possibile accedere alla fotocamera. Inserisci il riferimento manualmente.');
    }
  };

  const updateColumn = (id, patch) => setColumns(current => current.map(column => column.id === id ? { ...column, ...patch } : column));

  const submit = event => {
    event.preventDefault();
    setError('');
    if (!dateKey) return setError('Seleziona la data dell’estrazione.');
    const [year, month, day] = String(dateKey).split('-').map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
    if (!game.drawDays.includes(weekday)) return setError(`La data selezionata non corrisponde a un giorno di estrazione di ${game.name}.`);
    if (columns.length > (game.maxSimpleBets || 1)) return setError(`${game.name} consente al massimo ${game.maxSimpleBets} giocate semplici nello stesso boleto.`);
    const parsedReceiptExtra = Number(receiptExtra);
    if (game.extra.scope === 'receipt' && (!Number.isInteger(parsedReceiptExtra) || parsedReceiptExtra < game.extra.min || parsedReceiptExtra > game.extra.max)) return setError(`${game.extra.label}: inserisci il numero unico del resguardo tra ${game.extra.min} e ${game.extra.max}.`);
    for (const column of parsed) {
      if (column.parsedNumbers.length !== game.numbersToPick) return setError(`Ogni colonna deve contenere ${game.numbersToPick} numeri diversi.`);
      if (column.parsedNumbers.some(number => number < 1 || number > game.numberPoolMax)) return setError(`I numeri devono essere compresi tra 1 e ${game.numberPoolMax}.`);
      if (game.extra.scope === 'column' && (!Number.isInteger(column.parsedExtra) || column.parsedExtra < game.extra.min || column.parsedExtra > game.extra.max)) return setError(`${game.extra.label}: inserisci un valore tra ${game.extra.min} e ${game.extra.max}.`);
    }

    const draw = drawInfoForDate(gameId, dateKey);
    onSave({
      id: crypto.randomUUID(),
      gameId,
      columns: parsed.map(column => ({ id: crypto.randomUUID(), index: column.index, numbers: column.parsedNumbers, extra: game.extra.scope === 'receipt' ? parsedReceiptExtra : column.parsedExtra, status: 'scheduled' })),
      ...(game.extra.scope === 'receipt' ? { receiptExtra: parsedReceiptExtra } : {}),
      createdAt: new Date().toISOString(),
      purchasedAt: new Date().toISOString(),
      ...draw,
      method: 'external-manual',
      purchased: true,
      status: 'scheduled',
      metadata: { external: true, externalReference: reference.trim().slice(0, 160) },
    });
    stopScanner();
  };

  return (
    <AccessibleDialog open={open} onClose={close} labelledBy="manual-play-title" className="sm:max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold text-indigo-700">Schedina esterna</p><h2 id="manual-play-title" className="mt-1 text-2xl font-black text-primary">Aggiungi una giocata acquistata altrove</h2><p className="mt-2 text-sm leading-6 text-secondary">Inserisci i dati del resguardo. Primy non acquista la schedina: la conserva localmente e la rende verificabile.</p></div>
        <button type="button" onClick={close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted" aria-label="Chiudi"><XIcon/></button>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <GameSwitch active={gameId} onChange={setGameId} label="Gioco"/>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-primary">Data estrazione<span className="mt-2 flex min-w-0 rounded-xl border border-default bg-surface px-3 py-2"><input type="date" value={dateKey} onChange={event => setDateKey(event.target.value)} className="block w-full min-w-0 border-0 bg-transparent p-0 font-normal text-primary"/></span></label>
          <label className="text-sm font-bold text-primary">Riferimento facoltativo<input value={reference} onChange={event => setReference(event.target.value)} maxLength={160} placeholder="Codice o nota personale" className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal text-primary"/></label>
        </div>

        <div className="rounded-2xl border border-default p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-primary">Acquisisci codice del resguardo <span className="text-xs text-secondary">beta</span></p><p className="mt-1 text-sm leading-6 text-secondary">Il codice viene salvato come riferimento. I formati SELAE non sono documentati pubblicamente: i numeri devono essere confermati manualmente.</p></div><button type="button" onClick={scanning ? stopScanner : startScanner} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-black text-primary hover:bg-muted"><CameraIcon width="18" height="18"/>{scanning ? 'Chiudi fotocamera' : 'Apri fotocamera'}</button></div>
          {scanning && <video ref={videoRef} muted playsInline className="mt-4 aspect-video w-full rounded-xl bg-slate-950 object-cover"/>}
          {scanMessage && <p className="mt-3 text-sm leading-6 text-secondary" aria-live="polite">{scanMessage}</p>}
        </div>

        {game.extra.scope === 'receipt' && (
          <label className="block rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">
            Reintegro unico del resguardo
            <span className="mt-1 block text-xs font-normal leading-5 text-amber-800">Vale per tutte le colonne. Copialo dal resguardo SELAE.</span>
            <input value={receiptExtra} onChange={event => setReceiptExtra(event.target.value)} inputMode="numeric" className="mt-3 min-h-11 w-full rounded-xl border border-amber-300 bg-surface px-3 font-normal text-primary"/>
          </label>
        )}

        <div className="space-y-3">
          {columns.map((column, index) => (
            <div key={column.id} className="rounded-2xl bg-muted p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-black text-primary">Colonna {index + 1}</p>{columns.length > 1 && <button type="button" onClick={() => setColumns(current => current.filter(item => item.id !== column.id))} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"><TrashIcon width="17" height="17"/>Rimuovi</button>}</div>
              <div className={`mt-3 grid gap-3 ${game.extra.scope === 'column' ? 'sm:grid-cols-[1fr_150px]' : ''}`}>
                <label className="text-sm font-bold text-primary">I {game.numbersToPick} numeri<input value={column.numbers} onChange={event => updateColumn(column.id, { numbers: event.target.value })} placeholder={`Es. ${Array.from({ length: game.numbersToPick }, (_, i) => i + 1).join(', ')}`} inputMode="numeric" className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal text-primary"/></label>
                {game.extra.scope === 'column' && <label className="text-sm font-bold text-primary">{game.extra.label}<input value={column.extra} onChange={event => updateColumn(column.id, { extra: event.target.value })} inputMode="numeric" className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal text-primary"/></label>}
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setColumns(current => [...current, emptyColumn()])} disabled={columns.length >= (game.maxSimpleBets || 1)} className="flex min-h-11 items-center gap-2 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted disabled:opacity-50"><PlusIcon width="17" height="17"/>Aggiungi colonna ({columns.length}/{game.maxSimpleBets})</button>
        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{error}</div>}
        <div className="flex flex-col-reverse gap-3 border-t border-default pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={close} className="min-h-12 rounded-xl border border-default px-5 text-sm font-bold text-primary hover:bg-muted">Annulla</button><button type="submit" className="min-h-12 rounded-xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800">Salva schedina</button></div>
      </form>
    </AccessibleDialog>
  );
}
