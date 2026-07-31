import React, { useEffect, useMemo, useState } from 'react';
import GameSwitch from './GameSwitch.jsx';
import PrimyCoreDialog from './PrimyCoreDialog.jsx';
import { CalendarIcon, CheckIcon, InfoIcon, SparklesIcon, TicketIcon, WalletIcon } from './Icons.jsx';
import { getUpcomingNationalDraws, normalizeNationalNumber } from '../utils/nationalLottery.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const date = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Madrid' });
const FAVORITES_KEY = 'primy_national_favorites_v1';

function loadFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(value => /^\d{5}$/.test(value)).slice(0, 8) : [];
  } catch {
    return [];
  }
}

export default function NationalLotteryPanel({ activeGame, onGameChange, onPrepareNational, monthlySpent = 0, monthlyLimit = null, layout = 'wide' }) {
  const draws = useMemo(() => getUpcomingNationalDraws(new Date(), 7), []);
  const [drawId, setDrawId] = useState(draws[0]?.id || '');
  const [digits, setDigits] = useState(['', '', '', '', '']);
  const [quantity, setQuantity] = useState(1);
  const [favorites, setFavorites] = useState(loadFavorites);
  const [coreOpen, setCoreOpen] = useState(false);
  const selectedDraw = draws.find(draw => draw.id === drawId) || draws[0];
  const pattern = digits.map(value => value || '*').join('');
  const completed = normalizeNationalNumber(digits.join(''));
  const total = (selectedDraw?.pricePerDecimo || 0) * quantity;
  const exceedsLimit = monthlyLimit != null && monthlyLimit > 0 && monthlySpent + total > monthlyLimit;

  useEffect(() => {
    if (!drawId && draws[0]) setDrawId(draws[0].id);
  }, [drawId, draws]);

  const updateDigit = (index, value) => {
    const digit = String(value || '').replace(/\D/g, '').slice(-1);
    setDigits(current => current.map((item, itemIndex) => itemIndex === index ? digit : item));
  };

  const fillRandom = () => {
    const values = new Uint32Array(5);
    crypto.getRandomValues(values);
    setDigits(current => current.map((value, index) => value || String(values[index] % 10)));
  };

  const createRandom = () => {
    const values = new Uint32Array(5);
    crypto.getRandomValues(values);
    setDigits([...values].map(value => String(value % 10)));
  };

  const saveFavorite = () => {
    if (!completed || favorites.includes(completed)) return;
    const next = [completed, ...favorites].slice(0, 8);
    setFavorites(next);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* local optional */ }
  };

  const prepare = () => {
    if (!selectedDraw) return;
    onPrepareNational?.({ draw: selectedDraw, number: completed, pattern, ticketQuantity: quantity });
  };

  return (
    <section className="primy-panel primy-card-enter p-5 md:p-7">
      <div className="national-core-banner">
        <span className="national-core-banner__icon" aria-hidden="true"><TicketIcon width="24" height="24"/></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-800">Lotería Nacional · Primy Core</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Elige tu número. Primy organiza el resto.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Prepara un número de cinco cifras, selecciona el sorteo y guarda el décimo cuando lo hayas comprado. Primy no reserva números ni vende décimos.</p>
          <button type="button" className="primy-core-learn" onClick={() => setCoreOpen(true)}><InfoIcon width="18" height="18"/>Cómo funciona Primy Core</button>
        </div>
      </div>

      <div className="mt-7"><GameSwitch active={activeGame} onChange={onGameChange} label="Juego elegido"/></div>

      <div className={`mt-7 grid gap-6 ${layout === 'compact' ? '' : 'lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]'}`}>
        <div className="space-y-6">
          <fieldset>
            <legend className="text-sm font-semibold text-primary">1. Elige el sorteo</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {draws.slice(0, 6).map(draw => {
                const selected = draw.id === selectedDraw?.id;
                return (
                  <button key={draw.id} type="button" aria-pressed={selected} onClick={() => setDrawId(draw.id)} className={`national-draw-card ${selected ? 'is-selected' : ''}`}>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em]"><CalendarIcon width="16" height="16"/>{draw.drawName}</span>
                    <span className="mt-2 block text-sm font-semibold capitalize text-primary">{date.format(new Date(draw.drawDateTimeISO))}</span>
                    <span className="mt-1 block text-sm text-secondary">{euro.format(draw.pricePerDecimo)} por décimo</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-primary">2. Escribe o completa tu número</legend>
            <div className="national-number-editor mt-3" aria-label="Número de cinco cifras">
              {digits.map((digit, index) => (
                <input key={index} value={digit} onChange={event => updateDigit(index, event.target.value)} inputMode="numeric" pattern="[0-9]" maxLength="1" aria-label={`Cifra ${index + 1}`} placeholder="*" className="national-digit-input"/>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-secondary">Las casillas con * se completan al azar. Los ceros iniciales se conservan.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={fillRandom} className="primy-button primy-button-secondary"><SparklesIcon width="17" height="17"/>Completar vacías</button>
              <button type="button" onClick={createRandom} className="primy-button primy-button-secondary">Crear al azar</button>
              <button type="button" onClick={saveFavorite} disabled={!completed || favorites.includes(completed)} className="primy-button primy-button-secondary disabled:opacity-50">Guardar favorito</button>
            </div>
            {favorites.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Números favoritos">
                {favorites.map(favorite => <button key={favorite} type="button" onClick={() => setDigits(favorite.split(''))} className="national-favorite">{favorite}</button>)}
              </div>
            )}
          </fieldset>
        </div>

        <aside className="national-summary-card">
          <span className="national-summary-card__seal"><WalletIcon width="20" height="20"/></span>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-blue-800">Resumen</p>
          <p className="mt-3 font-display text-4xl font-semibold tracking-[.16em] text-primary">{digits.map(value => value || '•').join('')}</p>
          <p className="mt-2 text-sm font-semibold text-primary">{selectedDraw?.drawName}</p>
          <p className="mt-1 text-sm text-secondary">{selectedDraw ? date.format(new Date(selectedDraw.drawDateTimeISO)) : ''}</p>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-white/70 p-4">
            <p className="text-sm font-semibold text-primary">Número de décimos</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} disabled={quantity <= 1} className="national-stepper" aria-label="Reducir décimos">−</button>
              <output className="text-3xl font-semibold tabular-nums text-primary">{quantity}</output>
              <button type="button" onClick={() => setQuantity(value => Math.min(10, value + 1))} disabled={quantity >= 10} className="national-stepper" aria-label="Aumentar décimos">+</button>
            </div>
            <p className="mt-3 text-center text-xs text-secondary">De 1 a 10 décimos</p>
          </div>

          <div className="mt-5 flex items-end justify-between gap-3 border-t border-blue-100 pt-5">
            <div><p className="text-xs font-bold uppercase tracking-wide text-secondary">Total</p><p className="mt-1 text-3xl font-semibold tabular-nums text-primary">{euro.format(total)}</p></div>
            <span className="text-right text-xs leading-5 text-secondary">{euro.format(selectedDraw?.pricePerDecimo || 0)}<br/>por décimo</span>
          </div>

          {exceedsLimit && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">Este importe superaría tu límite mensual personal.</p>}

          <button type="button" onClick={prepare} disabled={!selectedDraw || exceedsLimit} className="primy-national-action mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-4 font-semibold text-white disabled:opacity-50"><CheckIcon width="19" height="19"/>Preparar número</button>
          <p className="mt-3 text-center text-xs leading-5 text-secondary">Prepararlo no lo reserva ni confirma su disponibilidad en los canales oficiales.</p>
        </aside>
      </div>
      <PrimyCoreDialog open={coreOpen} onClose={() => setCoreOpen(false)}/>
    </section>
  );
}
