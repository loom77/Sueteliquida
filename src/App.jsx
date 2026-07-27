import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useGameHistory } from './hooks/useStorage.js';
import { useHistoryData } from './hooks/useHistoryData.js';
import { useInstallPrompt } from './hooks/useInstallPrompt.js';
import { useDueNotifications } from './hooks/useDueNotifications.js';
import { useNow } from './hooks/useNow.js';
import { usePreferences } from './hooks/usePreferences.js';
import { useAppRouter } from './hooks/useAppRouter.js';
import { useBootstrapData } from './hooks/useBootstrapData.js';
import { usePwaUpdate } from './hooks/usePwaUpdate.js';
import { GAMES, getGameConfig } from './utils/gameConfig.js';
import { getNextDrawInfo, monthKeyMadrid } from './utils/drawSchedule.js';
import { playCost, playKnownPrize } from './utils/playModel.js';
import AppShell from './components/AppShell.jsx';
import Toast from './components/Toast.jsx';
import OnboardingDialog from './components/OnboardingDialog.jsx';

const DashboardView = lazy(() => import('./components/DashboardView.jsx'));
const GenerateView = lazy(() => import('./components/GenerateView.jsx'));
const PlaysView = lazy(() => import('./components/PlaysView.jsx'));
const SettingsView = lazy(() => import('./components/SettingsView.jsx'));
const ManualPlayDialog = lazy(() => import('./components/ManualPlayDialog.jsx'));

export default function App() {
  const { view, navigate } = useAppRouter();
  const [activeGame, setActiveGame] = useState('primitiva');
  const [columnCount, setColumnCount] = useState(1);
  const [latest, setLatest] = useState(null);
  const [saveState, setSaveState] = useState('unsaved');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationError, setGenerationError] = useState('');
  const [checkingGame, setCheckingGame] = useState('');
  const [toast, setToast] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [variantContext, setVariantContext] = useState(null);
  const workerRef = useRef(null);
  const generationRequestRef = useRef(0);

  const now = useNow(30000);
  const { providerStatus, drawOverview } = useBootstrapData();
  const installPrompt = useInstallPrompt();
  usePwaUpdate({
    onNeedRefresh: update => setToast({ message: 'È disponibile una nuova versione di Primy.', actionLabel: 'Aggiorna ora', action: update }),
    onOfflineReady: () => setToast({ message: 'Primy è pronta per funzionare anche senza connessione nelle funzioni locali.' }),
  });
  const historyData = useHistoryData(activeGame, { enabled: view === 'generate' });
  const { preferences, updatePreferences, error: preferenceError } = usePreferences();
  const game = getGameConfig(activeGame);
  const {
    history,
    storageError,
    verificationError,
    savePlay,
    markPurchased,
    toggleFavorite,
    removePlay,
    restorePlay,
    clearHistory,
    importHistory,
    setOfficialPrize,
    checkResults,
  } = useGameHistory();

  useEffect(() => () => workerRef.current?.terminate(), []);
  useEffect(() => {
    const titles = { dashboard: 'Home', generate: 'Crea giocata', plays: 'Le mie giocate', settings: 'Impostazioni' };
    document.title = `${titles[view]} · Primy`;
  }, [view]);
  useEffect(() => { if (preferences.defaultGame && !latest && !busy) setActiveGame(preferences.defaultGame); }, [preferences.defaultGame]);

  const selectGame = gameId => {
    if (busy) {
      generationRequestRef.current += 1;
      workerRef.current?.terminate();
      workerRef.current = null;
    }
    setBusy(false);
    setProgress(0);
    setGenerationError('');
    setActiveGame(gameId);
    setLatest(null);
    setSaveState('unsaved');
    if (variantContext?.gameId !== gameId) setVariantContext(null);
  };

  const openGenerate = gameId => {
    if (gameId) selectGame(gameId);
    navigate('generate');
  };

  const ensureWorker = () => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./workers/fusion.worker.js', import.meta.url), { type: 'module' });
    }
    return workerRef.current;
  };

  const generate = () => {
    setBusy(true);
    setProgress(0.02);
    setGenerationError('');
    setLatest(null);
    setSaveState('unsaved');

    const requestId = ++generationRequestRef.current;
    const worker = ensureWorker();
    worker.onmessage = ({ data }) => {
      if (data?.requestId !== requestId) return;
      if (data.type === 'progress') return setProgress(Math.min(0.96, Number(data.progress) || 0));
      if (data.type === 'done') {
        setLatest(data.play);
        setProgress(1);
        setBusy(false);
        return;
      }
      if (data.type === 'error') {
        setGenerationError(data.message || 'Generazione non riuscita.');
        setBusy(false);
      }
    };
    worker.onerror = event => {
      if (generationRequestRef.current !== requestId) return;
      setGenerationError(event?.message || 'Il metodo automatico non è riuscito ad avviarsi nel browser.');
      setBusy(false);
      worker.terminate();
      workerRef.current = null;
    };

    const samples = Math.min(28000, Math.max(6500, columnCount * 1100));
    worker.postMessage({
      requestId,
      gameId: activeGame,
      analysis: historyData.analysis,
      columnCount,
      samples,
      avoidColumns: variantContext?.columns || [],
      variantOf: variantContext?.id || null,
    });
  };

  const saveLatest = purchased => {
    if (!latest) return;
    const stored = savePlay(latest, { purchased });
    if (!stored) return;
    setLatest(stored);
    setSaveState(purchased ? 'purchased' : 'draft');
    setVariantContext(null);
    setToast(purchased ? { message: 'Giocata registrata. Primy la segnalerà quando sarà pronta per la verifica.', actionLabel: 'Annulla registrazione', action: () => { removePlay(stored.id); setLatest(latest); setSaveState('unsaved'); } } : { message: 'Bozza salvata nelle tue giocate.' });
  };

  const discardLatest = () => {
    setLatest(null);
    setSaveState('unsaved');
  };

  const removeWithUndo = id => {
    const play = history.find(item => item.id === id);
    if (!play) return;
    removePlay(id);
    setToast({ message: 'Giocata eliminata.', actionLabel: 'Annulla', action: () => restorePlay(play) });
  };

  const purchaseExisting = id => {
    markPurchased(id);
    setToast({ message: 'Giocata registrata come acquistata.' });
  };

  const saveExternal = play => {
    const stored = savePlay(play, { purchased: true });
    if (!stored) return;
    setManualOpen(false);
    setToast({ message: 'Schedina esterna aggiunta alle tue giocate.' });
    navigate('plays');
  };

  const repeatExact = play => {
    const draw = getNextDrawInfo(play.gameId);
    const repeated = {
      ...play,
      id: crypto.randomUUID(),
      columns: play.columns.map((column, index) => ({ ...column, id: crypto.randomUUID(), index: index + 1, status: 'draft', prizeCategory: undefined, prizeDisplay: undefined, officialPrize: undefined, matches: undefined })),
      createdAt: new Date().toISOString(),
      ...draw,
      purchased: false,
      purchasedAt: undefined,
      status: 'draft',
      checkedAt: undefined,
      result: undefined,
      favorite: false,
      method: 'repeat-exact',
      metadata: { ...(play.metadata || {}), repeatedFrom: play.id },
    };
    setActiveGame(play.gameId);
    setColumnCount(play.columns.length);
    setVariantContext(null);
    setLatest(repeated);
    setSaveState('unsaved');
    navigate('generate');
  };

  const createVariant = play => {
    setActiveGame(play.gameId);
    setColumnCount(play.columns.length);
    setLatest(null);
    setSaveState('unsaved');
    setVariantContext({ id: play.id, gameId: play.gameId, columns: play.columns, label: `${getGameConfig(play.gameId).shortName} del ${new Intl.DateTimeFormat('it-IT').format(new Date(play.createdAt))}` });
    navigate('generate');
  };

  const dueByGame = useMemo(() => Object.keys(GAMES).reduce((output, gameId) => {
    output[gameId] = history.filter(play => play.gameId === gameId && play.computedStatus === 'awaiting_check').length;
    return output;
  }, {}), [history]);
  const dueTotal = Object.values(dueByGame).reduce((sum, count) => sum + count, 0);
  useDueNotifications({ enabled: preferences.notifications, dueCount: dueTotal });

  const checkGame = async gameId => {
    setCheckingGame(gameId);
    const result = await checkResults(gameId);
    setCheckingGame('');
    if (result.checked > 0) setToast({ message: `${result.checked} ${result.checked === 1 ? 'giocata verificata' : 'giocate verificate'}.` });
    else if (!result.error) setToast({ message: 'Non sono stati trovati nuovi risultati da applicare.' });
    return result;
  };

  const checkAll = async () => {
    setCheckingGame('all');
    let checked = 0;
    let firstError = '';
    for (const gameId of Object.keys(GAMES)) {
      if (dueByGame[gameId]) {
        const result = await checkResults(gameId);
        checked += result.checked || 0;
        firstError ||= result.error || '';
      }
    }
    setCheckingGame('');
    setToast({ message: firstError || (checked ? `${checked} ${checked === 1 ? 'giocata verificata' : 'giocate verificate'}.` : 'Non sono stati trovati nuovi risultati da applicare.') });
  };

  const monthlyStats = useMemo(() => {
    const key = monthKeyMadrid();
    return history.reduce((output, play) => {
      if (!play.purchased || monthKeyMadrid(play.purchasedAt || play.createdAt) !== key) return output;
      output.plays += 1;
      output.spent += playCost(play);
      if (play.status === 'checked') output.won += playKnownPrize(play);
      return output;
    }, { spent: 0, won: 0, plays: 0 });
  }, [history]);

  const totals = useMemo(() => history.reduce((output, play) => {
    if (!play.purchased) return output;
    output.plays += 1;
    output.columns += play.columns.length;
    return output;
  }, { plays: 0, columns: 0 }), [history]);

  const clearAll = () => {
    if (!window.confirm('Cancellare definitivamente tutte le giocate e le bozze locali?')) return;
    clearHistory();
    setToast({ message: 'Tutti i dati locali sono stati cancellati.' });
  };

  return (
    <AppShell view={view} onNavigate={navigate} dueCount={dueTotal}>
      <Suspense fallback={<div className="rounded-2xl border border-border bg-surface p-6 text-sm text-secondary">Caricamento schermata…</div>}>
      {view === 'dashboard' && <DashboardView now={now} history={history} monthlyStats={monthlyStats} totals={totals} dueByGame={dueByGame} drawOverview={drawOverview} onGenerate={openGenerate} onAddExternal={() => setManualOpen(true)} onOpenPlays={() => navigate('plays')} onCheckAll={checkAll} checking={checkingGame === 'all'}/>} 

      {view === 'generate' && <GenerateView game={game} activeGame={activeGame} onGameChange={selectGame} columnCount={columnCount} setColumnCount={setColumnCount} onGenerate={generate} busy={busy} progress={progress} generationError={generationError} monthlySpent={monthlyStats.spent} monthlyLimit={preferences.monthlyLimit} latest={latest} saveState={saveState} onSaveDraft={() => saveLatest(false)} onPurchase={() => saveLatest(true)} onDiscard={discardLatest} onOpenPlays={() => navigate('plays')} onToast={message => setToast({ message })} variantLabel={variantContext?.label || ''} onClearVariant={() => setVariantContext(null)}/>} 

      {view === 'plays' && <PlaysView plays={history} dueByGame={dueByGame} verificationError={verificationError} checkingGame={checkingGame} onCheck={checkGame} onPurchase={purchaseExisting} onRemove={removeWithUndo} onSetPrize={setOfficialPrize} onFavorite={toggleFavorite} onRepeat={repeatExact} onVariant={createVariant} onAddExternal={() => setManualOpen(true)}/>} 

      {view === 'settings' && <SettingsView activeGame={activeGame} onGameChange={selectGame} providerStatus={providerStatus} historyState={historyData} preferences={preferences} updatePreferences={updatePreferences} preferenceError={preferenceError} storageError={storageError} history={history} onImport={importHistory} onClear={clearAll} onToast={message => setToast({ message })} installPrompt={installPrompt}/>} 

      <ManualPlayDialog open={manualOpen} initialGame={activeGame} onClose={() => setManualOpen(false)} onSave={saveExternal}/>
      <OnboardingDialog open={!preferences.onboardingSeen} onComplete={() => updatePreferences({ onboardingSeen: true })}/>
      </Suspense>
      <Toast toast={toast} onClose={() => setToast(null)}/>
    </AppShell>
  );
}
