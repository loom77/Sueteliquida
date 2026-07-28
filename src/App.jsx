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
import { useAuth } from './hooks/useAuth.js';
import { GAMES, getGameConfig } from './utils/gameConfig.js';
import { getNextDrawInfo, monthKeyMadrid } from './utils/drawSchedule.js';
import { playCost, playKnownPrize } from './utils/playModel.js';
import AppShell from './components/AppShell.jsx';
import Toast from './components/Toast.jsx';
import OnboardingDialog from './components/OnboardingDialog.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import LocalDataMigrationDialog from './components/LocalDataMigrationDialog.jsx';

const DashboardView = lazy(() => import('./components/DashboardView.jsx'));
const GenerateView = lazy(() => import('./components/GenerateView.jsx'));
const PlaysView = lazy(() => import('./components/PlaysView.jsx'));
const SettingsView = lazy(() => import('./components/SettingsView.jsx'));
const ManualPlayDialog = lazy(() => import('./components/ManualPlayDialog.jsx'));

function AuthenticatedApp({ auth }) {
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
    onNeedRefresh: update => setToast({ message: 'Hay una nueva versión de Primy disponible.', actionLabel: 'Actualizar ahora', action: update }),
    onOfflineReady: () => setToast({ message: 'Primy está lista para funcionar sin conexión en las funciones locales.' }),
  });
  const historyData = useHistoryData(activeGame, { enabled: view === 'generate' });
  const { preferences, updatePreferences, error: preferenceError } = usePreferences(auth.user);
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
    syncStatus,
    lastSyncedAt,
    pendingLocalCount,
    migrationBusy,
    importLocalData,
    dismissLocalData,
  } = useGameHistory(auth.user);

  useEffect(() => () => workerRef.current?.terminate(), []);
  useEffect(() => {
    const titles = { dashboard: 'Inicio', generate: 'Crear jugada', plays: 'Mis jugadas', settings: 'Ajustes' };
    document.title = `${titles[view]} · Primy`;
  }, [view]);
  useEffect(() => {
    if (!auth.notice) return;
    setToast({ message: auth.notice });
    auth.clearNotice();
  }, [auth.notice]);
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
    setColumnCount(current => Math.min(current, getGameConfig(gameId).maxSimpleBets || 1));
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
        setGenerationError(data.message || 'No se ha podido generar la jugada.');
        setBusy(false);
      }
    };
    worker.onerror = event => {
      if (generationRequestRef.current !== requestId) return;
      setGenerationError(event?.message || 'El método automático no ha podido iniciarse en el navegador.');
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
    setToast(purchased ? { message: 'Jugada registrada. Primy te avisará cuando esté lista para comprobarla.', actionLabel: 'Deshacer registro', action: () => { removePlay(stored.id); setLatest(latest); setSaveState('unsaved'); } } : { message: 'Borrador guardado en tus jugadas.' });
  };

  const discardLatest = () => {
    setLatest(null);
    setSaveState('unsaved');
  };

  const removeWithUndo = id => {
    const play = history.find(item => item.id === id);
    if (!play) return;
    removePlay(id);
    setToast({ message: 'Jugada eliminada.', actionLabel: 'Deshacer', action: () => restorePlay(play) });
  };

  const purchaseExisting = id => {
    markPurchased(id);
    setToast({ message: 'Jugada registrada como comprada.' });
  };

  const saveExternal = play => {
    const stored = savePlay(play, { purchased: true });
    if (!stored) return;
    setManualOpen(false);
    setToast({ message: 'Boleto externo añadido a tus jugadas.' });
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
      receiptPrize: undefined,
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
    setVariantContext({ id: play.id, gameId: play.gameId, columns: play.columns, label: `${getGameConfig(play.gameId).shortName} del ${new Intl.DateTimeFormat('es-ES').format(new Date(play.createdAt))}` });
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
    if (result.checked > 0) setToast({ message: `${result.checked} ${result.checked === 1 ? 'jugada comprobada' : 'jugadas comprobadas'}.` });
    else if (!result.error) setToast({ message: 'No se han encontrado resultados nuevos que aplicar.' });
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
    setToast({ message: firstError || (checked ? `${checked} ${checked === 1 ? 'jugada comprobada' : 'jugadas comprobadas'}.` : 'No se han encontrado resultados nuevos que aplicar.') });
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
    if (!window.confirm('¿Eliminar definitivamente todas las jugadas y los borradores de tu cuenta?')) return;
    clearHistory();
    setToast({ message: 'Se han eliminado todas las jugadas de tu cuenta.' });
  };

  return (
    <AppShell view={view} onNavigate={navigate} dueCount={dueTotal} user={auth.user} onSignOut={auth.signOut} syncStatus={syncStatus} lastSyncedAt={lastSyncedAt}>
      <Suspense fallback={<div className="rounded-2xl border border-border bg-surface p-6 text-sm text-secondary">Cargando pantalla…</div>}>
      {view === 'dashboard' && <DashboardView now={now} history={history} monthlyStats={monthlyStats} totals={totals} dueByGame={dueByGame} drawOverview={drawOverview} onGenerate={openGenerate} onAddExternal={() => setManualOpen(true)} onOpenPlays={() => navigate('plays')} onCheckAll={checkAll} checking={checkingGame === 'all'}/>} 

      {view === 'generate' && <GenerateView game={game} activeGame={activeGame} onGameChange={selectGame} columnCount={columnCount} setColumnCount={setColumnCount} onGenerate={generate} busy={busy} progress={progress} generationError={generationError} monthlySpent={monthlyStats.spent} monthlyLimit={preferences.monthlyLimit} latest={latest} saveState={saveState} onSaveDraft={() => saveLatest(false)} onPurchase={() => saveLatest(true)} onDiscard={discardLatest} onOpenPlays={() => navigate('plays')} onToast={message => setToast({ message })} variantLabel={variantContext?.label || ''} onClearVariant={() => setVariantContext(null)}/>} 

      {view === 'plays' && <PlaysView plays={history} dueByGame={dueByGame} verificationError={verificationError} checkingGame={checkingGame} onCheck={checkGame} onPurchase={purchaseExisting} onRemove={removeWithUndo} onSetPrize={setOfficialPrize} onFavorite={toggleFavorite} onRepeat={repeatExact} onVariant={createVariant} onAddExternal={() => setManualOpen(true)}/>} 

      {view === 'settings' && <SettingsView activeGame={activeGame} onGameChange={selectGame} providerStatus={providerStatus} historyState={historyData} preferences={preferences} updatePreferences={updatePreferences} preferenceError={preferenceError} storageError={storageError} history={history} onImport={importHistory} onClear={clearAll} onToast={message => setToast({ message })} installPrompt={installPrompt} user={auth.user} onSignOut={auth.signOut} syncStatus={syncStatus} lastSyncedAt={lastSyncedAt}/>} 

      <ManualPlayDialog open={manualOpen} initialGame={activeGame} onClose={() => setManualOpen(false)} onSave={saveExternal}/>
      <OnboardingDialog open={!preferences.onboardingSeen} onComplete={() => updatePreferences({ onboardingSeen: true })}/>
      </Suspense>
      <LocalDataMigrationDialog count={pendingLocalCount} busy={migrationBusy} onImport={importLocalData} onSkip={dismissLocalData}/>
      <Toast toast={toast} onClose={() => setToast(null)}/>
    </AppShell>
  );
}


function AuthLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-4 text-primary">
      <div role="status" className="rounded-2xl border border-default bg-surface px-6 py-5 text-sm font-bold text-secondary">Abriendo tu cuenta…</div>
    </main>
  );
}

export default function App() {
  const auth = useAuth();
  if (auth.loading) return <AuthLoadingScreen/>;
  if (auth.recoveryMode) return <AuthScreen auth={auth} initialMode="update-password"/>;
  if (!auth.user) return <AuthScreen auth={auth}/>;
  return <AuthenticatedApp auth={auth}/>;
}
