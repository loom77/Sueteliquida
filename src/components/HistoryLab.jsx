import React from 'react';
import { DatabaseIcon, RefreshIcon, ShieldIcon } from './Icons.jsx';

export default function HistoryLab({ historyState }) {
  const { loading, loaded, error, notice, analysis, source, limited, reload, load } = historyState;
  const totalDraws = analysis?.totalDraws || 0;

  return (
    <section className="rounded-2xl border border-default bg-surface p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-primary">Dati storici</h2>
          <p className="mt-1 text-sm leading-6 text-secondary">Questi dati sono facoltativi. Primy li usa solo dopo un confronto fuori campione con il casuale uniforme.</p>
        </div>
        <button type="button" onClick={loaded ? reload : load} disabled={loading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted disabled:opacity-60">
          <RefreshIcon className={loading ? 'animate-spin' : ''} width="17" height="17"/>
          {loading ? 'Caricamento…' : loaded ? 'Aggiorna dati' : 'Carica dati'}
        </button>
      </div>

      {!loaded && !loading && (
        <div className="mt-5 rounded-xl bg-muted p-4">
          <p className="font-black text-primary">Nessun caricamento automatico</p>
          <p className="mt-1 text-sm leading-6 text-secondary">Per velocizzare la dashboard e ridurre le richieste al provider, lo storico viene scaricato solo quando generi una giocata o premi “Carica dati”.</p>
        </div>
      )}

      {error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{error}</div>}
      {notice && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{notice}</div>}

      {(loaded || loading) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted p-4"><DatabaseIcon className="text-indigo-700" width="20" height="20"/><p className="mt-3 text-sm font-bold text-primary">Estrazioni disponibili</p><p className="mt-1 text-2xl font-black text-primary">{loading ? '—' : totalDraws}</p></div>
          <div className="rounded-xl bg-muted p-4"><ShieldIcon className="text-emerald-700" width="20" height="20"/><p className="mt-3 text-sm font-bold text-primary">Decisione automatica</p><p className="mt-1 text-lg font-black text-primary">{loading ? 'Analisi in attesa' : totalDraws ? 'Confronto attivo' : 'Casuale uniforme'}</p></div>
          <div className="rounded-xl bg-muted p-4"><DatabaseIcon className="text-amber-700" width="20" height="20"/><p className="mt-3 text-sm font-bold text-primary">Disponibilità</p><p className="mt-1 text-lg font-black text-primary">{loading ? 'Caricamento' : limited ? 'Archivio limitato' : totalDraws ? 'Archivio disponibile' : 'Non disponibile'}</p></div>
        </div>
      )}

      <details className="mt-5 rounded-xl border border-default p-4">
        <summary className="cursor-pointer text-sm font-bold text-primary">Mostra dettagli tecnici</summary>
        <div className="mt-3 space-y-3 text-sm leading-6 text-secondary">
          <p>Primy confronta modelli bayesiani, di recenza e KNN con una baseline casuale a pari budget computazionale. Un modello storico entra nella generazione solo quando supera i controlli previsti.</p>
          <p>Le estrazioni passate non rendono un numero “dovuto” e non trasformano una lotteria casuale in un sistema prevedibile.</p>
          <p>Fonte: {source || 'non caricata'}.</p>
        </div>
      </details>
    </section>
  );
}
