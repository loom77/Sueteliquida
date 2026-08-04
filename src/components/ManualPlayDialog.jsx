import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getGameConfig } from '../utils/gameConfig.js';
import { drawInfoForDate, getNextDrawInfo } from '../utils/drawSchedule.js';
import { getNationalDrawInfo, normalizeNationalNumber } from '../utils/nationalLottery.js';
import GameSwitch from './GameSwitch.jsx';
import AccessibleDialog from './AccessibleDialog.jsx';
import { CameraIcon, PlusIcon, TrashIcon, XIcon } from './Icons.jsx';

function emptyColumn() {
  return { id: crypto.randomUUID(), numbers: '', extra: '', secondary: '' };
}

function parseNumberList(value) {
  return [...new Set(String(value || '').split(/[\s,;.-]+/).map(Number).filter(Number.isInteger))].sort((left, right) => left - right);
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
  const [nationalNumber, setNationalNumber] = useState('');
  const [nationalQuantity, setNationalQuantity] = useState(1);
  const [nationalPrice, setNationalPrice] = useState(3);
  const [nationalSeries, setNationalSeries] = useState('');
  const [nationalFraction, setNationalFraction] = useState('');
  const [nationalDrawName, setNationalDrawName] = useState('Sorteo de Lotería Nacional');
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
    setColumns(Array.from({ length: getGameConfig(initialGame).minSimpleBets || 1 }, () => emptyColumn()));
    setReceiptExtra('');
    setError('');
    setScanMessage('');
    setNationalNumber('');
    setNationalQuantity(1);
    setNationalSeries('');
    setNationalFraction('');
  }, [open, initialGame]);

  useEffect(() => {
    if (!open) return;
    setDateKey(getNextDrawInfo(gameId).drawDateKey);
    setColumns(Array.from({ length: getGameConfig(gameId).minSimpleBets || 1 }, () => emptyColumn()));
    setReceiptExtra('');
    setError('');
    if (gameId === 'loteria-nacional') {
      const draw = getNationalDrawInfo(getNextDrawInfo(gameId).drawDateKey);
      setNationalPrice(draw.pricePerDecimo);
      setNationalDrawName(draw.drawName);
    }
  }, [gameId, open]);

  useEffect(() => () => stopScanner(), []);

  const parsed = useMemo(() => columns.map((column, index) => ({
    ...column,
    index: index + 1,
    parsedNumbers: parseNumberList(column.numbers),
    parsedExtra: Number(column.extra),
    parsedSecondary: parseNumberList(column.secondary),
  })), [columns]);

  const startScanner = async () => {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
      setScanMessage('La lectura del código no está disponible en este navegador. Introduce la referencia manualmente.');
      return;
    }
    try {
      stopScanner();
      setScanMessage('Enfoca el código QR o el código de barras del resguardo.');
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
            setScanMessage('Código capturado. Comprueba y completa los números del boleto.');
            stopScanner();
            return;
          }
        } catch { /* continúa la lectura */ }
        frameRef.current = requestAnimationFrame(scan);
      };
      frameRef.current = requestAnimationFrame(scan);
    } catch {
      stopScanner();
      setScanMessage('No se ha podido acceder a la cámara. Introduce la referencia manualmente.');
    }
  };

  const updateColumn = (id, patch) => setColumns(current => current.map(column => column.id === id ? { ...column, ...patch } : column));

  const submit = event => {
    event.preventDefault();
    setError('');
    if (!dateKey) return setError('Selecciona la fecha del sorteo.');
    if (gameId === 'loteria-nacional') {
      const number = normalizeNationalNumber(nationalNumber);
      if (!number) return setError('Introduce un número completo de cinco cifras.');
      const quantity = Math.max(1, Math.min(10, Number(nationalQuantity) || 1));
      const price = Math.max(0, Number(nationalPrice) || 0);
      const draw = getNationalDrawInfo(dateKey, { drawName: nationalDrawName || 'Sorteo de Lotería Nacional', pricePerDecimo: price });
      onSave({
        id: crypto.randomUUID(),
        gameId: 'loteria-nacional',
        betType: 'national-decimo',
        nationalNumber: number,
        ticketQuantity: quantity,
        pricePerDecimo: price,
        equivalentBets: quantity,
        series: nationalSeries ? Number(nationalSeries) : null,
        fraction: nationalFraction ? Number(nationalFraction) : null,
        columns: [{ id: crypto.randomUUID(), index: 1, number, quantity, series: nationalSeries ? Number(nationalSeries) : null, fraction: nationalFraction ? Number(nationalFraction) : null, status: 'scheduled' }],
        createdAt: new Date().toISOString(),
        purchasedAt: new Date().toISOString(),
        ...draw,
        purchased: true,
        status: 'scheduled',
        method: 'external-manual-national',
        metadata: { external: true, externalReference: reference.trim().slice(0, 160) },
      });
      stopScanner();
      return;
    }
    const [year, month, day] = String(dateKey).split('-').map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
    if (!game.drawDays.includes(weekday)) return setError(`La fecha seleccionada no corresponde a un día de sorteo de ${game.name}.`);
    if (columns.length < (game.minSimpleBets || 1)) return setError(`${game.name} requiere al menos ${game.minSimpleBets} apuestas simples en un boleto de un solo sorteo.`);
    if (columns.length > (game.maxSimpleBets || 1)) return setError(`${game.name} permite como máximo ${game.maxSimpleBets} apuestas simples en el mismo boleto.`);

    const parsedReceiptExtra = Number(receiptExtra);
    if (game.extra?.scope === 'receipt' && (!Number.isInteger(parsedReceiptExtra) || parsedReceiptExtra < game.extra.min || parsedReceiptExtra > game.extra.max)) {
      return setError(`${game.extra.label}: introduce el número único del resguardo entre ${game.extra.min} y ${game.extra.max}.`);
    }

    for (const column of parsed) {
      if (column.parsedNumbers.length !== game.numbersToPick) return setError(`Cada columna debe contener ${game.numbersToPick} números distintos.`);
      if (column.parsedNumbers.some(number => number < 1 || number > game.numberPoolMax)) return setError(`Los números deben estar comprendidos entre 1 y ${game.numberPoolMax}.`);
      if (game.extra?.scope === 'column' && (!Number.isInteger(column.parsedExtra) || column.parsedExtra < game.extra.min || column.parsedExtra > game.extra.max)) {
        return setError(`${game.extra.label}: introduce un valor entre ${game.extra.min} y ${game.extra.max}.`);
      }
      if (game.secondary) {
        if (column.parsedSecondary.length !== game.secondary.count) return setError(`Cada columna debe contener ${game.secondary.count} estrellas distintas.`);
        if (column.parsedSecondary.some(value => value < game.secondary.min || value > game.secondary.max)) {
          return setError(`Las estrellas deben estar comprendidas entre ${game.secondary.min} y ${game.secondary.max}.`);
        }
      }
    }

    const draw = drawInfoForDate(gameId, dateKey);
    onSave({
      id: crypto.randomUUID(),
      gameId,
      columns: parsed.map(column => ({
        id: crypto.randomUUID(),
        index: column.index,
        numbers: column.parsedNumbers,
        ...(game.secondary
          ? { secondaryNumbers: column.parsedSecondary }
          : { extra: game.extra.scope === 'receipt' ? parsedReceiptExtra : column.parsedExtra }),
        status: 'scheduled',
      })),
      ...(game.extra?.scope === 'receipt' ? { receiptExtra: parsedReceiptExtra } : {}),
      createdAt: new Date().toISOString(),
      purchasedAt: new Date().toISOString(),
      ...draw,
      betType: 'simple',
      equivalentBets: parsed.length,
      method: 'external-manual',
      purchased: true,
      status: 'scheduled',
      metadata: { external: true, externalReference: reference.trim().slice(0, 160) },
    });
    stopScanner();
  };

  const hasColumnSupplement = Boolean(game.secondary || game.extra?.scope === 'column');

  if (gameId === 'loteria-nacional') {
    return (
      <AccessibleDialog open={open} onClose={close} labelledBy="manual-play-title" className="sm:max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-sm font-bold text-blue-800">Décimo externo</p><h2 id="manual-play-title" className="mt-1 text-2xl font-semibold text-primary">Registrar Lotería Nacional</h2><p className="mt-2 text-sm leading-6 text-secondary">Copia los datos del décimo comprado. Primy lo guardará y lo comprobará cuando exista un resultado oficial archivado.</p></div>
          <button type="button" onClick={close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted" aria-label="Cerrar"><XIcon/></button>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <GameSwitch active={gameId} onChange={setGameId} label="Juego" gameIds={['primitiva', 'bonoloto', 'euromillones', 'gordoprimitiva', 'eurodreams', 'loteria-nacional']}/>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-primary">Fecha del sorteo<input type="date" value={dateKey} onChange={event => { const value = event.target.value; setDateKey(value); const draw = getNationalDrawInfo(value); setNationalPrice(draw.pricePerDecimo); setNationalDrawName(draw.drawName); }} className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal"/></label>
            <label className="text-sm font-bold text-primary">Nombre del sorteo<input value={nationalDrawName} onChange={event => setNationalDrawName(event.target.value)} maxLength={80} className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal"/></label>
          </div>
          <label className="block text-sm font-bold text-primary">Número de cinco cifras<input value={nationalNumber} onChange={event => setNationalNumber(event.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" placeholder="Ej. 00742" className="mt-2 min-h-14 w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 font-display text-2xl font-semibold tracking-[.2em] text-primary"/><span className="mt-1 block text-xs font-normal text-secondary">Los ceros iniciales se conservan.</span></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-primary">Décimos (1–10)<input type="number" min="1" max="10" value={nationalQuantity} onChange={event => setNationalQuantity(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal"/></label>
            <label className="text-sm font-bold text-primary">Precio por décimo<input type="number" min="0" step="0.01" value={nationalPrice} onChange={event => setNationalPrice(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal"/></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-primary">Serie opcional<input value={nationalSeries} onChange={event => setNationalSeries(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal"/></label>
            <label className="text-sm font-bold text-primary">Fracción opcional<input value={nationalFraction} onChange={event => setNationalFraction(event.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal"/></label>
          </div>
          <label className="text-sm font-bold text-primary">Referencia opcional<input value={reference} onChange={event => setReference(event.target.value)} maxLength={160} placeholder="Código o nota personal" className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal"/></label>
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Serie y fracción pueden ser necesarias para confirmar un Premio Especial. Sin esos datos Primy comprobará únicamente las categorías asociadas al número.</p>
          {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{error}</div>}
          <div className="flex flex-col-reverse gap-3 border-t border-default pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={close} className="min-h-12 rounded-xl border border-default px-5 text-sm font-bold text-primary hover:bg-muted">Cancelar</button><button type="submit" className="primy-national-action min-h-12 rounded-xl px-5 text-sm font-semibold text-white">Guardar décimo</button></div>
        </form>
      </AccessibleDialog>
    );
  }

  return (
    <AccessibleDialog open={open} onClose={close} labelledBy="manual-play-title" className="sm:max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold text-primy-700">Boleto externo</p><h2 id="manual-play-title" className="mt-1 text-2xl font-semibold text-primary">Añadir una jugada comprada en otro lugar</h2><p className="mt-2 text-sm leading-6 text-secondary">Introduce los datos del resguardo. Primy no compra el boleto: lo guarda en tu cuenta y permite comprobarlo.</p></div>
        <button type="button" onClick={close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted" aria-label="Cerrar"><XIcon/></button>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <GameSwitch active={gameId} onChange={setGameId} label="Juego" gameIds={['primitiva', 'bonoloto', 'euromillones', 'gordoprimitiva', 'eurodreams', 'loteria-nacional']}/>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-primary">Fecha del sorteo<span className="mt-2 flex min-w-0 rounded-2xl border border-default bg-surface px-3 py-2"><input type="date" value={dateKey} onChange={event => setDateKey(event.target.value)} className="block w-full min-w-0 border-0 bg-transparent p-0 font-normal text-primary"/></span></label>
          <label className="text-sm font-bold text-primary">Referencia opcional<input value={reference} onChange={event => setReference(event.target.value)} maxLength={160} placeholder="Código o nota personal" className="mt-2 min-h-11 w-full rounded-2xl border border-default bg-surface px-3 font-normal text-primary"/></label>
        </div>

        <div className="rounded-2xl border border-default p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-primary">Capturar código del resguardo <span className="text-xs text-secondary">beta</span></p><p className="mt-1 text-sm leading-6 text-secondary">El código se guarda como referencia. Los formatos de SELAE no están documentados públicamente: los números deben confirmarse manualmente.</p></div><button type="button" onClick={scanning ? stopScanner : startScanner} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-default px-4 text-sm font-semibold text-primary hover:bg-muted"><CameraIcon width="18" height="18"/>{scanning ? 'Cerrar cámara' : 'Abrir cámara'}</button></div>
          {scanning && <video ref={videoRef} muted playsInline className="mt-4 aspect-video w-full rounded-xl bg-primy-700 object-cover"/>}
          {scanMessage && <p className="mt-3 text-sm leading-6 text-secondary" aria-live="polite">{scanMessage}</p>}
        </div>

        {game.extra?.scope === 'receipt' && (
          <label className="block rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">
            Reintegro único del resguardo
            <span className="mt-1 block text-xs font-normal leading-5 text-amber-800">Se aplica a todas las columnas. Cópialo del resguardo de SELAE.</span>
            <input value={receiptExtra} onChange={event => setReceiptExtra(event.target.value)} inputMode="numeric" className="mt-3 min-h-11 w-full rounded-xl border border-amber-300 bg-surface px-3 font-normal text-primary"/>
          </label>
        )}

        <div className="space-y-3">
          {columns.map((column, index) => (
            <div key={column.id} className="rounded-2xl bg-muted p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-semibold text-primary">Columna {index + 1}</p>{columns.length > (game.minSimpleBets || 1) && <button type="button" onClick={() => setColumns(current => current.filter(item => item.id !== column.id))} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"><TrashIcon width="17" height="17"/>Eliminar</button>}</div>
              <div className={`mt-3 grid gap-3 ${hasColumnSupplement ? 'sm:grid-cols-[1fr_190px]' : ''}`}>
                <label className="text-sm font-bold text-primary">Los {game.numbersToPick} números<input value={column.numbers} onChange={event => updateColumn(column.id, { numbers: event.target.value })} placeholder={`Ej. ${Array.from({ length: game.numbersToPick }, (_, item) => item + 1).join(', ')}`} inputMode="numeric" className="mt-2 min-h-11 w-full rounded-2xl border border-default bg-surface px-3 font-normal text-primary"/></label>
                {game.extra?.scope === 'column' && <label className="text-sm font-bold text-primary">{game.extra.label}<input value={column.extra} onChange={event => updateColumn(column.id, { extra: event.target.value })} inputMode="numeric" className="mt-2 min-h-11 w-full rounded-2xl border border-default bg-surface px-3 font-normal text-primary"/></label>}
                {game.secondary && <label className="text-sm font-bold text-primary">{game.secondary.label}<span className="mt-1 block text-xs font-normal text-secondary">{game.secondary.count} valores del {game.secondary.min} al {game.secondary.max}</span><input value={column.secondary} onChange={event => updateColumn(column.id, { secondary: event.target.value })} placeholder="Ej. 3, 11" inputMode="numeric" className="mt-2 min-h-11 w-full rounded-2xl border border-default bg-surface px-3 font-normal text-primary"/></label>}
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setColumns(current => [...current, emptyColumn()])} disabled={columns.length >= (game.maxSimpleBets || 1)} className="flex min-h-11 items-center gap-2 rounded-2xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted disabled:opacity-50"><PlusIcon width="17" height="17"/>Añadir columna ({columns.length}/{game.maxSimpleBets})</button>
        {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{error}</div>}
        <div className="flex flex-col-reverse gap-3 border-t border-default pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={close} className="min-h-12 rounded-2xl border border-default px-5 text-sm font-bold text-primary hover:bg-muted">Cancelar</button><button type="submit" className="min-h-12 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800">Guardar boleto</button></div>
      </form>
    </AccessibleDialog>
  );
}
