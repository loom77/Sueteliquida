import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGameHistory } from './useStorage.js';
import { useHistoryData } from './useHistoryData.js';
import { useInstallPrompt } from './useInstallPrompt.js';
import { useDueNotifications } from './useDueNotifications.js';
import { useNow } from './useNow.js';
import { usePreferences } from './usePreferences.js';
import { useAppRouter } from './useAppRouter.js';
import { useBootstrapData } from './useBootstrapData.js';
import { usePwaUpdate } from './usePwaUpdate.js';
import { useToast } from './useToast.js';
import { useGenerationController } from './useGenerationController.js';
import { usePlayActions } from './usePlayActions.js';
import { useResultChecking } from './useResultChecking.js';
import { GAMES, getGameConfig } from '../utils/gameConfig.js';
import { getDueByGame, getDueTotal, getMonthlyStats, getPurchasedTotals } from '../utils/appMetrics.js';
import { createNationalPlay } from '../utils/nationalLottery.js';
import { createSimpleQuinielaPlay } from '../sports/quinielaPlay.js';

const VIEW_TITLES = {
  dashboard: 'Inicio',
  generate: 'Crear jugada',
  explore: 'Juegos',
  plays: 'Archivo',
  settings: 'Perfil',
};

export function useAppController(auth) {
  const { view, navigate } = useAppRouter();
  const [activeGame, setActiveGame] = useState('primitiva');
  const [columnCount, setColumnCount] = useState(1);
  const [betType, setBetType] = useState('simple');
  const [systemSize, setSystemSize] = useState(7);
  const [manualOpen, setManualOpen] = useState(false);
  const [variantContext, setVariantContext] = useState(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const now = useNow(30_000);
  const { toast, showToast, clearToast } = useToast();
  const generation = useGenerationController({ view });
  const { providerStatus, drawOverview } = useBootstrapData();
  const installPrompt = useInstallPrompt();
  const historyData = useHistoryData(activeGame, { enabled: view === 'settings' });
  const { preferences, updatePreferences, error: preferenceError } = usePreferences(auth.user);
  const game = getGameConfig(activeGame);
  const historyStore = useGameHistory(auth.user);
  const { history } = historyStore;

  usePwaUpdate({
    onNeedRefresh: update => showToast({
      message: 'Hay una nueva versión de Primy disponible.',
      actionLabel: 'Actualizar ahora',
      action: update,
      duration: 12_000,
    }),
    onOfflineReady: () => showToast('Primy está lista para funcionar sin conexión en las funciones locales.'),
  });

  useEffect(() => {
    document.title = `${VIEW_TITLES[view] || 'Primy'} · Primy`;
  }, [view]);

  useEffect(() => {
    if (!auth.notice) return;
    showToast(auth.notice);
    auth.clearNotice();
  }, [auth.notice, auth.clearNotice, showToast]);

  useEffect(() => {
    if (preferences.defaultGame && !generation.latest && !generation.busy) {
      setActiveGame(preferences.defaultGame);
    }
  }, [preferences.defaultGame, generation.latest, generation.busy]);

  const selectGame = useCallback(gameId => {
    if (!GAMES[gameId]) return;
    generation.cancel({ announce: false });
    generation.resetResult();
    const selectedGame = getGameConfig(gameId);
    setActiveGame(gameId);
    setBetType('simple');
    setSystemSize(7);
    setColumnCount(current => Math.max(selectedGame.minSimpleBets || 1, Math.min(current, selectedGame.maxSimpleBets || 1)));
    setVariantContext(current => current?.gameId === gameId ? current : null);
  }, [generation]);

  const openGenerate = useCallback(gameId => {
    if (gameId) selectGame(gameId);
    navigate('generate');
  }, [navigate, selectGame]);

  const generate = useCallback(() => {
    generation.generate({ activeGame, columnCount, variantContext, betType, systemSize });
  }, [generation, activeGame, columnCount, variantContext, betType, systemSize]);

  const cancelGeneration = useCallback(() => generation.cancel({ announce: true }), [generation]);

  const prepareNational = useCallback(config => {
    try {
      const play = createNationalPlay(config || {});
      generation.setLatest(play);
      generation.setSaveState('unsaved');
      generation.setGenerationError('');
    } catch (error) {
      generation.setGenerationError(error?.message || 'No se ha podido preparar el número.');
    }
  }, [generation]);

  const prepareQuiniela = useCallback(config => {
    try {
      const play = createSimpleQuinielaPlay(config || {});
      generation.setLatest(play);
      generation.setSaveState('unsaved');
      generation.setGenerationError('');
    } catch (error) {
      generation.setGenerationError(error?.message || 'No se ha podido preparar La Quiniela.');
    }
  }, [generation]);

  const playActions = usePlayActions({
    history,
    savePlay: historyStore.savePlay,
    markPurchased: historyStore.markPurchased,
    removePlay: historyStore.removePlay,
    restorePlay: historyStore.restorePlay,
    generation,
    navigate,
    showToast,
    setActiveGame,
    setColumnCount,
    setVariantContext,
    setManualOpen,
    setBetType,
    setSystemSize,
  });

  const dueByGame = useMemo(() => getDueByGame(history), [history]);
  const dueTotal = useMemo(() => getDueTotal(dueByGame), [dueByGame]);
  const monthlyStats = useMemo(() => getMonthlyStats(history, now), [history, now]);
  const totals = useMemo(() => getPurchasedTotals(history), [history]);

  useDueNotifications({ enabled: preferences.notifications, dueCount: dueTotal });

  const { checkingGame, checkGame, checkAll } = useResultChecking({
    dueByGame,
    checkResults: historyStore.checkResults,
    showToast,
  });

  const confirmClearAll = useCallback(() => {
    historyStore.clearHistory();
    setClearConfirmOpen(false);
    showToast('Se han eliminado todas las jugadas de tu cuenta.');
  }, [historyStore, showToast]);

  const propsByView = {
    dashboard: {
      now,
      history,
      monthlyStats,
      totals,
      dueByGame,
      drawOverview,
      onGenerate: openGenerate,
      onAddExternal: () => setManualOpen(true),
      onOpenPlays: () => navigate('plays'),
      onExplore: () => navigate('explore'),
      onCheckAll: checkAll,
      checking: checkingGame === 'all',
      displayName: auth.displayName,
    },
    explore: {
      now,
      history,
      onCreate: openGenerate,
      onRegister: gameId => {
        if (!GAMES[gameId]) return;
        selectGame(gameId);
        setManualOpen(true);
      },
      onOpenArchive: () => navigate('plays'),
    },
    generate: {
      game,
      activeGame,
      onGameChange: selectGame,
      columnCount,
      setColumnCount,
      betType,
      setBetType,
      systemSize,
      setSystemSize,
      onGenerate: generate,
      onPrepareNational: prepareNational,
      onPrepareQuiniela: prepareQuiniela,
      onCancel: cancelGeneration,
      busy: generation.busy,
      progress: generation.progress,
      generationError: generation.generationError,
      monthlySpent: monthlyStats.spent,
      monthlyLimit: preferences.monthlyLimit,
      latest: generation.latest,
      saveState: generation.saveState,
      onSaveDraft: () => playActions.saveLatest(false),
      onPurchase: purchaseData => playActions.saveLatest(true, purchaseData),
      onDiscard: playActions.discardLatest,
      onOpenPlays: () => navigate('plays'),
      onToast: showToast,
      variantLabel: variantContext?.label || '',
      onClearVariant: () => setVariantContext(null),
    },
    plays: {
      plays: history,
      dueByGame,
      verificationError: historyStore.verificationError,
      checkingGame,
      onCheck: checkGame,
      onPurchase: playActions.purchaseExisting,
      onRemove: playActions.removeWithUndo,
      onSetPrize: historyStore.setOfficialPrize,
      onFavorite: historyStore.toggleFavorite,
      onRepeat: playActions.repeatExact,
      onVariant: playActions.createVariant,
      onAddExternal: () => setManualOpen(true),
      onCreate: () => openGenerate(activeGame),
    },
    settings: {
      activeGame,
      onGameChange: selectGame,
      providerStatus,
      historyState: historyData,
      preferences,
      updatePreferences,
      preferenceError,
      storageError: historyStore.storageError,
      history,
      onImport: historyStore.importHistory,
      onClear: () => setClearConfirmOpen(true),
      onToast: showToast,
      installPrompt,
      user: auth.user,
      displayName: auth.displayName,
      profileLoading: auth.profileLoading,
      onUpdateDisplayName: auth.updateDisplayName,
      onSignOut: auth.signOut,
      syncStatus: historyStore.syncStatus,
      lastSyncedAt: historyStore.lastSyncedAt,
      pendingSyncCount: historyStore.pendingSyncCount,
      onRetrySync: historyStore.retrySync,
    },
  };

  return {
    view,
    navigate,
    requiresAgeConfirmation: !preferences.ageConfirmed,
    ageGate: {
      open: true,
      onConfirm: ({ confirmedAt }) => updatePreferences({ ageConfirmed: true, ageConfirmedAt: confirmedAt }),
      onReject: auth.signOut,
    },
    shellProps: {
      view,
      onNavigate: navigate,
      dueCount: dueTotal,
      user: auth.user,
      displayName: auth.displayName,
      onSignOut: auth.signOut,
      syncStatus: historyStore.syncStatus,
      lastSyncedAt: historyStore.lastSyncedAt,
      pendingSyncCount: historyStore.pendingSyncCount,
    },
    propsByView,
    overlays: {
      manual: {
        open: manualOpen,
        initialGame: activeGame === 'quiniela' ? 'primitiva' : activeGame,
        onClose: () => setManualOpen(false),
        onSave: playActions.saveExternal,
      },
      onboarding: {
        open: preferences.ageConfirmed && !preferences.onboardingSeen,
        onComplete: () => updatePreferences({ onboardingSeen: true }),
      },
      clearConfirm: {
        open: clearConfirmOpen,
        onClose: () => setClearConfirmOpen(false),
        onConfirm: confirmClearAll,
        title: 'Eliminar todas las jugadas',
        description: 'Esta acción eliminará definitivamente las jugadas y los borradores guardados en tu cuenta. No se puede deshacer.',
        confirmLabel: 'Sí, eliminar todo',
      },
      migration: {
        count: historyStore.pendingLocalCount,
        busy: historyStore.migrationBusy,
        onImport: historyStore.importLocalData,
        onSkip: historyStore.dismissLocalData,
      },
      toast: {
        toast,
        onClose: clearToast,
      },
    },
  };
}
