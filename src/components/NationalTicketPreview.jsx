import React, { useEffect, useState } from 'react';
import { CheckIcon, CopyIcon, TicketIcon } from './Icons.jsx';
import { formatDrawDate, formatDrawTime } from '../utils/drawSchedule.js';
import { playCost } from '../utils/playModel.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export default function NationalTicketPreview({ play, saveState = 'unsaved', onSaveDraft, onPurchase, onRegenerate, onDiscard, onOpenPlays, onToast }) {
  const [confirmPurchase, setConfirmPurchase] = useState(false);
  const [series, setSeries] = useState('');
  const [fraction, setFraction] = useState('');

  useEffect(() => {
    setConfirmPurchase(false);
    setSeries(play?.series || '');
    setFraction(play?.fraction || '');
  }, [play?.id]);

  if (!play) return null;

  const number = play.nationalNumber || play.columns?.[0]?.number || '00000';
  const copy = async () => {
    const text = `Lotería Nacional · ${number}\n${play.drawName || ''}\n${formatDrawDate(play.drawDateISO)} · ${play.ticketQuantity} décimo(s)`;
    try { await navigator.clipboard.writeText(text); onToast?.('Décimo copiado al portapapeles.'); } catch { onToast?.('No se ha podido copiar automáticamente.'); }
  };

  if (saveState !== 'unsaved') {
    return (
      <section className="national-ticket-saved primy-card-enter">
        <span className="national-ticket-saved__icon"><CheckIcon width="26" height="26"/></span>
        <div><p className="text-sm font-bold text-blue-800">{saveState === 'purchased' ? 'Décimo registrado' : 'Número guardado'}</p><h2 className="mt-2 text-2xl font-semibold text-primary">{number}</h2><p className="mt-2 text-sm leading-6 text-secondary">{saveState === 'purchased' ? 'Primy lo comprobará cuando el resultado oficial esté disponible.' : 'Puedes recuperarlo desde tu archivo y registrarlo después de comprarlo.'}</p></div>
        <button type="button" onClick={onOpenPlays} className="primy-button primy-button-primary">Abrir archivo</button>
      </section>
    );
  }

  return (
    <section className="national-ticket-preview primy-card-enter" aria-labelledby="national-preview-title">
      <div className="national-ticket-preview__topline"><span><TicketIcon width="18" height="18"/>Lotería Nacional</span><span>{play.drawType?.replaceAll('-', ' ')}</span></div>
      <div className="national-ticket-preview__body">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-800">Número preparado</p>
        <h2 id="national-preview-title" className="national-ticket-number">{number}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="national-ticket-data"><span>Sorteo</span><strong>{play.drawName || 'Lotería Nacional'}</strong><small>{formatDrawDate(play.drawDateISO)} · {formatDrawTime(play.drawDateISO)}</small></div>
          <div className="national-ticket-data"><span>Décimos</span><strong>{play.ticketQuantity}</strong><small>{euro.format(play.pricePerDecimo)} cada uno · Total {euro.format(playCost(play))}</small></div>
        </div>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Importante:</strong> Primy ha preparado el número, pero no lo ha reservado. Confirma su disponibilidad y compra únicamente en un canal autorizado.</div>

        {confirmPurchase ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <h3 className="font-semibold text-primary">Registrar como comprado</h3>
            <p className="mt-1 text-sm leading-6 text-secondary">Serie y fracción son opcionales, pero pueden ser necesarias para comprobar un premio especial.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-primary">Serie<input value={series} onChange={event => setSeries(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" className="mt-2 min-h-11 w-full rounded-xl border border-blue-200 bg-surface px-3 font-normal"/></label>
              <label className="text-sm font-semibold text-primary">Fracción<input value={fraction} onChange={event => setFraction(event.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" className="mt-2 min-h-11 w-full rounded-xl border border-blue-200 bg-surface px-3 font-normal"/></label>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setConfirmPurchase(false)} className="primy-button primy-button-secondary">Volver</button><button type="button" onClick={() => { setConfirmPurchase(false); onPurchase({ series: series ? Number(series) : null, fraction: fraction ? Number(fraction) : null }); }} className="primy-button primy-button-primary"><CheckIcon width="18" height="18"/>Confirmar compra</button></div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setConfirmPurchase(true)} className="primy-national-action min-h-12 rounded-xl px-5 font-semibold text-white">He comprado · {euro.format(playCost(play))}</button><button type="button" onClick={onSaveDraft} className="primy-button primy-button-secondary">Guardar número</button></div>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" onClick={copy} className="primy-button primy-button-secondary"><CopyIcon width="17" height="17"/>Copiar</button><button type="button" onClick={onRegenerate} className="primy-button primy-button-secondary">Preparar otro</button><button type="button" onClick={onDiscard} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50">Descartar</button></div>
        <p className="mt-5 text-center text-xs leading-5 text-secondary">Primy no vende décimos, no garantiza disponibilidad y no asegura ningún premio.</p>
      </div>
    </section>
  );
}
