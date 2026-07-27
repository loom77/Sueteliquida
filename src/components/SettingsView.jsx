import React, { useRef, useState } from 'react';
import GameSwitch from './GameSwitch.jsx';
import HistoryLab from './HistoryLab.jsx';
import { BellIcon, DatabaseIcon, DeviceIcon, DownloadIcon, InfoIcon, InstallIcon, MoonIcon, ShieldIcon, SunIcon, TrashIcon, UploadIcon } from './Icons.jsx';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

export default function SettingsView({ activeGame, onGameChange, providerStatus, historyState, preferences, updatePreferences, preferenceError, storageError, history, onImport, onClear, onToast, installPrompt }) {
  const fileRef = useRef(null);
  const [limitDraft, setLimitDraft] = useState(preferences.monthlyLimit ?? '');

  const saveLimit = () => {
    const value = limitDraft === '' ? null : Math.max(0, Number(limitDraft) || 0);
    updatePreferences({ monthlyLimit: value });
    onToast(value == null ? 'Limite mensile rimosso.' : `Limite mensile impostato a ${euro.format(value)}.`);
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) return onToast('Questo browser non supporta le notifiche web.');
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    updatePreferences({ notifications: enabled });
    onToast(enabled ? 'Notifiche attivate. Primy avviserà quando l’app è aperta e trova giocate da verificare.' : 'Permesso notifiche non concesso.');
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ version: 12, exportedAt: new Date().toISOString(), plays: history }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `primy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return onToast('Il backup supera 2 MB e non può essere importato nel browser.');
    try { const parsed = JSON.parse(await file.text()); const count = onImport(parsed); onToast(`${count} ${count === 1 ? 'giocata importata' : 'giocate importate'}.`); }
    catch (error) { onToast(error?.message || 'Il file selezionato non è valido.'); }
  };

  return (
    <div className="mx-auto max-w-[1120px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div><p className="text-sm font-bold text-indigo-700">Impostazioni</p><h1 className="mt-1 text-3xl font-black tracking-tight text-primary">Gestisci Primy</h1><p className="mt-2 text-sm leading-6 text-secondary">Configura l’esperienza, il limite di spesa e i dati salvati sul dispositivo.</p></div>

      <section className="rounded-2xl border border-default bg-surface p-5 md:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="flex items-center gap-2 text-xl font-black text-primary"><DatabaseIcon width="21" height="21"/>Fonte dati</h2><p className="mt-1 text-sm leading-6 text-secondary">Collegamento usato per storico, boti e verifica.</p></div><button type="button" onClick={providerStatus.reload} className="min-h-11 rounded-xl border border-default px-4 text-sm font-bold hover:bg-muted">Ricontrolla</button></div><div className={`mt-5 rounded-xl p-4 ${providerStatus.online ? 'bg-emerald-50 text-emerald-900' : providerStatus.configured === false ? 'bg-amber-50 text-amber-950' : 'bg-rose-50 text-rose-900'}`}><p className="font-black">{providerStatus.loading ? 'Controllo in corso…' : providerStatus.online ? 'Fonte dati collegata' : providerStatus.configured === false ? 'API key non configurata' : 'Fonte dati non disponibile'}</p>{providerStatus.message && <p className="mt-1 text-sm leading-6">{providerStatus.message}</p>}</div></section>

      <section className="rounded-2xl border border-default bg-surface p-5 md:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-black text-primary">Guida iniziale</h2><p className="mt-1 text-sm leading-6 text-secondary">Rivedi in qualsiasi momento il percorso che spiega generazione, salvataggio, verifica e privacy locale.</p></div><button type="button" onClick={() => updatePreferences({ onboardingSeen:false })} className="min-h-11 rounded-xl border border-default px-4 text-sm font-black text-primary hover:bg-muted">Rivedi introduzione</button></div></section>

      <section className="rounded-2xl border border-default bg-surface p-5 md:p-6"><h2 className="text-xl font-black text-primary">Aspetto</h2><p className="mt-1 text-sm leading-6 text-secondary">Scegli un tema o lascia che Primy segua il dispositivo.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{[{ id:'system', label:'Sistema', icon:DeviceIcon },{ id:'light', label:'Chiaro', icon:SunIcon },{ id:'dark', label:'Scuro', icon:MoonIcon }].map(item => { const Icon=item.icon; return <button type="button" key={item.id} onClick={() => updatePreferences({ appearance:item.id })} aria-pressed={preferences.appearance===item.id} className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 text-sm font-black ${preferences.appearance===item.id ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-default text-primary hover:bg-muted'}`}><Icon width="19" height="19"/>{item.label}</button>; })}</div></section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-default bg-surface p-5 md:p-6"><h2 className="flex items-center gap-2 text-xl font-black text-primary"><BellIcon width="21" height="21"/>Avvisi</h2><p className="mt-1 text-sm leading-6 text-secondary">Quando Primy è aperta, può mostrare una notifica di sistema se trova giocate pronte da verificare.</p><button type="button" onClick={preferences.notifications ? () => updatePreferences({ notifications:false }) : enableNotifications} className="mt-5 min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800">{preferences.notifications ? 'Disattiva notifiche' : 'Attiva notifiche'}</button></div>
        <div className="rounded-2xl border border-default bg-surface p-5 md:p-6"><h2 className="flex items-center gap-2 text-xl font-black text-primary"><InstallIcon width="21" height="21"/>Installazione</h2><p className="mt-1 text-sm leading-6 text-secondary">Usa Primy come app autonoma dalla schermata Home.</p>{installPrompt?.installed ? <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-900">Primy risulta già installata.</p> : installPrompt?.canInstall ? <button type="button" onClick={installPrompt.install} className="mt-5 min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800">Installa Primy</button> : <p className="mt-5 text-sm leading-6 text-secondary">Su iPhone/iPad: Condividi → Aggiungi alla schermata Home.</p>}</div>
      </section>

      <section className="rounded-2xl border border-default bg-surface p-5 md:p-6"><h2 className="flex items-center gap-2 text-xl font-black text-primary"><ShieldIcon width="21" height="21"/>Limite mensile personale</h2><p className="mt-1 text-sm leading-6 text-secondary">Promemoria locale: Primy avvisa prima di superare la cifra scelta.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-bold text-primary">Limite in euro<input type="number" min="0" step="1" value={limitDraft} onChange={event => setLimitDraft(event.target.value)} placeholder="Nessun limite" className="mt-2 min-h-11 w-full rounded-xl border border-default px-3 font-normal"/></label><button type="button" onClick={saveLimit} className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800">Salva limite</button></div>{(preferenceError || storageError) && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{preferenceError || storageError}</div>}</section>

      <details className="rounded-2xl border border-default bg-surface p-5 md:p-6">
        <summary className="cursor-pointer text-xl font-black text-primary">Impostazioni avanzate e metodo Primy</summary>
        <p className="mt-2 text-sm leading-6 text-secondary">Apri questa sezione solo per controllare la fonte dati storica e i dettagli tecnici del metodo automatico.</p>
        <div className="mt-5 border-t border-default pt-5"><h2 className="flex items-center gap-2 text-lg font-black text-primary"><InfoIcon width="21" height="21"/>Metodo automatico Primy</h2><p className="mt-1 text-sm leading-6 text-secondary">La pagina Genera non espone algoritmi o punteggi predittivi. Qui puoi consultare lo stato dello storico.</p><div className="mt-5"><GameSwitch active={activeGame} onChange={onGameChange} label="Gioco da analizzare"/></div></div>
        <div className="mt-5"><HistoryLab historyState={historyState}/></div>
      </details>

      <section className="rounded-2xl border border-default bg-surface p-5 md:p-6"><h2 className="text-xl font-black text-primary">Backup locale</h2><p className="mt-1 text-sm leading-6 text-secondary">Esporta le giocate in JSON o ripristina un backup Primy.</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={exportData} disabled={!history.length} className="flex min-h-11 items-center gap-2 rounded-xl border border-default px-4 text-sm font-bold hover:bg-muted disabled:opacity-50"><DownloadIcon width="18" height="18"/>Esporta backup</button><button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-11 items-center gap-2 rounded-xl border border-default px-4 text-sm font-bold hover:bg-muted"><UploadIcon width="18" height="18"/>Importa backup</button><input ref={fileRef} type="file" accept="application/json,.json" onChange={importFile} className="sr-only"/></div></section>

      <section className="rounded-2xl border border-rose-200 bg-surface p-5 md:p-6"><h2 className="text-xl font-black text-rose-800">Elimina tutti i dati locali</h2><p className="mt-1 text-sm leading-6 text-secondary">Questa azione cancella giocate e bozze memorizzate nel browser.</p><button type="button" onClick={onClear} disabled={!history.length} className="mt-5 flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-black text-white hover:bg-rose-800 disabled:opacity-50"><TrashIcon width="18" height="18"/>Cancella tutto</button></section>
      <section className="rounded-2xl bg-slate-950 p-5 text-white md:p-6"><h2 className="text-xl font-black">Gioco responsabile</h2><p className="mt-2 text-sm leading-6 text-slate-300">Primy è uno strumento informativo per maggiorenni. Non vende schedine, non prevede estrazioni e non garantisce vincite. Non inseguire le perdite e non utilizzare denaro necessario per spese essenziali.</p></section>
    </div>
  );
}
