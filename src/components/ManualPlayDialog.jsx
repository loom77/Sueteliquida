import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getGameConfig } from '../utils/gameConfig.js';
import { drawInfoForDate, getNextDrawInfo } from '../utils/drawSchedule.js';
import { getNationalDrawInfo, normalizeNationalNumber } from '../utils/nationalLottery.js';
import GameSwitch from './GameSwitch.jsx';
import AccessibleDialog from './AccessibleDialog.jsx';
import { CameraIcon, PlusIcon, TrashIcon, XIcon } from './Icons.jsx';
import { appendManualDigit, formatManualSelection, parseManualSelection, removeLastManualDigit, sanitizeManualSelectionText, toggleManualSelection } from '../utils/manualEntry.js';

function emptyColumn() {
  return { id: crypto.randomUUID(), numbers: '', extra: '', secondary: '' };
}

function parseNumberList(value) {
  return parseManualSelection(value);
}

function ManualNumberPicker({ label, value, onChange, min = 1, max, count, helper = '', compact = false }) {
  const selected = parseManualSelection(value, { min, max });
  const numbers = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  const complete = selected.length === count;

  return (
    <fieldset className="rounded-2xl border border-default bg-surface p-3 sm:p-4">
      <legend className="px-1 text-sm font-bold text-primary">{label}</legend>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-xs font-semibold ${complete ? 'text-primy-700' : 'text-secondary'}`}>{selected.length}/{count} seleccionados</p>
        {selected.length > 0 && <button type="button" onClick={() => onChange('')} className="min-h-9 rounded-xl px-3 text-xs font-bold text-secondary hover:bg-muted">Limpiar</button>}
      </div>
      {helper && <p className="mt-1 text-xs leading-5 text-secondary">{helper}</p>}
      <div className={`mt-3 grid gap-2 ${compact ? 'grid-cols-5 sm:grid-cols-10' : 'grid-cols-7 sm:grid-cols-10'}`}>
        {numbers.map(number => {
          const active = selected.includes(number);
          const blocked = !active && selected.length >= count;
          return (
            <button
              key={number}
              type="button"
              aria-pressed={active}
              disabled={blocked}
              onClick={() => onChange(toggleManualSelection(value, number, { min, max, limit: count }))}
              className={`flex min-h-10 items-center justify-center rounded-xl border text-sm font-extrabold transition ${active ? 'border-primy-700 bg-primy-700 text-white shadow-sm' : 'border-default bg-surface text-primary hover:border-primy-400 hover:bg-primy-50'} disabled:cursor-not-allowed disabled:opacity-35`}
            >
              {number}
            </button>
          );
        })}
      </div>
      <label className="mt-4 block text-xs font-semibold text-secondary">Pegar o escribir números separados
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          value={value}
          onChange={event => onChange(sanitizeManualSelectionText(event.target.value))}
          placeholder={formatManualSelection(numbers.slice(0, count))}
          className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 text-base font-normal text-primary"
        />
      </label>
    </fieldset>
  );
}

function ManualDigitPad({ value, onChange, maxLength = 5 }) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, maxLength);
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <div className="grid grid-cols-5 gap-2" aria-label="Número del décimo">
        {Array.from({ length: maxLength }, (_, index) => (
          <span key={index} className="flex min-h-14 items-center justify-center rounded-xl border border-blue-200 bg-surface font-display text-2xl font-semibold text-primary">{digits[index] || '–'}</span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[1,2,3,4,5,6,7,8,9].map(digit => <button key={digit} type="button" onClick={() => onChange(appendManualDigit(digits, digit, maxLength))} className="min-h-12 rounded-xl border border-blue-200 bg-surface text-lg font-extrabold text-primary hover:bg-blue-100">{digit}</button>)}
        <button type="button" onClick={() => onChange('')} className="min-h-12 rounded-xl border border-blue-200 bg-surface text-sm font-bold text-secondary hover:bg-blue-100">Borrar</button>
        <button type="button" onClick={() => onChange(appendManualDigit(digits, 0, maxLength))} className="min-h-12 rounded-xl border border-blue-200 bg-surface text-lg font-extrabold text-primary hover:bg-blue-100">0</button>
        <button type="button" onClick={() => onChange(removeLastManualDigit(digits))} className="min-h-12 rounded-xl border border-blue-200 bg-surface text-sm font-bold text-secondary hover:bg-blue-100" aria-label="Eliminar última cifra">⌫</button>
      </div>
      <label className="mt-4 block text-xs font-semibold text-secondary">También puedes pegar las cinco cifras
        <input type="text" inputMode="numeric" pattern="[0-9]*" value={digits} onChange={event => onChange(event.target.value.replace(/\D/g, '').slice(0, maxLength))} placeholder="00742" className="mt-2 min-h-11 w-full rounded-xl border border-blue-200 bg-surface px-3 text-base font-normal tracking-[.16em] text-primary"/>
      </label>
    </div>
  );
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
          <div><p className="text-sm font-bold text-primary">Número de cinco cifras</p><p className="mt-1 text-xs leading-5 text-secondary">Toca las cifras del décimo. Los ceros iniciales se conservan.</p><div className="mt-2"><ManualDigitPad value={nationalNumber} onChange={setNationalNumber}/></div></div>
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
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-bold">Reintegro único del resguardo</p>
            <p className="mt-1 text-xs font-normal leading-5 text-amber-800">Se aplica a todas las columnas. Cópialo del resguardo de SELAE.</p>
            <div className="mt-3"><ManualNumberPicker label={game.extra.label} value={receiptExtra} onChange={setReceiptExtra} min={game.extra.min} max={game.extra.max} count={1} compact helper="Toca el dígito impreso en el resguardo."/></div>
          </div>
        )}

        <div className="space-y-3">
          {columns.map((column, index) => (
            <div key={column.id} className="rounded-2xl bg-muted p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-semibold text-primary">Columna {index + 1}</p>{columns.length > (game.minSimpleBets || 1) && <button type="button" onClick={() => setColumns(current => current.filter(item => item.id !== column.id))} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"><TrashIcon width="17" height="17"/>Eliminar</button>}</div>
              <div className="mt-3 space-y-3">
                <ManualNumberPicker
                  label={`Los ${game.numbersToPick} números`}
                  value={column.numbers}
                  onChange={value => updateColumn(column.id, { numbers: value })}
                  min={1}
                  max={game.numberPoolMax}
                  count={game.numbersToPick}
                  helper={`Toca exactamente ${game.numbersToPick} números del 1 al ${game.numberPoolMax}.`}
                />
                {game.extra?.scope === 'column' && <ManualNumberPicker label={game.extra.label} value={column.extra} onChange={value => updateColumn(column.id, { extra: value })} min={game.extra.min} max={game.extra.max} count={1} compact helper={`Selecciona un valor del ${game.extra.min} al ${game.extra.max}.`}/>} 
                {game.secondary && <ManualNumberPicker label={game.secondary.label} value={column.secondary} onChange={value => updateColumn(column.id, { secondary: value })} min={game.secondary.min} max={game.secondary.max} count={game.secondary.count} compact helper={`Selecciona ${game.secondary.count} valores del ${game.secondary.min} al ${game.secondary.max}.`}/>} 
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
