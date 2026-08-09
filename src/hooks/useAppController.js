import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameHistory } from './useStorage.js';
import { useHistoryData } from './useHistoryData.js';
import { useInstallPrompt } from './useInstallPrompt.js';
import { useDueNotifications } from './useDueNotifications.js';
import { useNow } from './useNow.js';
import { usePreferences } from './usePreferences.js';
import { useAppRouter } from './useAppRouter.js';
import { useBootstrapData } from './useBootstrapData.js';
import { useToast } from './useToast.js';
import { useGenerationController } from './useGenerationController.js';
import { usePlayActions } from './usePlayActions.js';
import { useResultChecking } from './useResultChecking.js';
import { GAMES, getGameConfig } from '../utils/gameConfig.js';
import { getDueByGame, getDueTotal, getMonthlyStats, getPurchasedTotals } from '../utils/appMetrics.js';
import { createNationalPlay } from '../utils/nationalLottery.js';
import { getUpcomingPlayableDraws } from '../utils/drawSchedule.js';
import { createSimpleQuinielaPlay } from '../sports/quinielaPlay.js';
import { createSimpleQuinigolPlay } from '../sports/quinigolPlay.js';
import { createLototurfPlay, createQuintuplePlusPlay } from '../horse/plays.js';

const VIEW_TITLES = {
  dashboard: 'Inicio',
  generate: 'Crear jugada',
  explore: 'Juegos',
  plays: 'Archivo',
  settings: 'Perfil',
};

export function useAppController(auth) {
  const unsavedNavigationRef = useRef(false);
  const [pendingUnsavedAction, setPendingUnsavedAction] = useState(null);
  const { view, navigate: routerNavigate } = useAppRouter({
    shouldBlockNavigation: nextView => unsavedNavigationRef.current && nextView !== 'generate',
    onBlockedNavigation: nextView => setPendingUnsavedAction({ type: 'navigate', nextView }),
  });
  const navigate = useCallback((nextView, options) => routerNavigate(nextView, options), [routerNavigate]);
  const [activeGame, setActiveGame] = useState('primitiva');
  const [columnCount, setColumnCount] = useState(1);
  const [betType, setBetType] = useState('simple');
  const [systemSize, setSystemSize] = useState(7);
  const [selectedDrawKey, setSelectedDrawKey] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [variantContext, setVariantContext] = useState(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const defaultGameAppliedRef = useRef(false);
  const now = useNow(30_000);
  const { toast, showToast, clearToast } = useToast();
  const generation = useGenerationController({ view });
  const hasUnsavedGeneratedPlay = Boolean(generation.latest && generation.saveState === 'unsaved');
  unsavedNavigationRef.current = view === 'generate' && hasUnsavedGeneratedPlay;
  const { providerStatus, drawOverview } = useBootstrapData();
  const installPrompt = useInstallPrompt();
  const historyData = useHistoryData(activeGame, { enabled: view === 'settings' });
  const { preferences, updatePreferences, error: preferenceError } = usePreferences(auth.user);
  const game = getGameConfig(activeGame);
  const drawOptions = useMemo(() => {
    if (!game.drawDays?.length || game.model === 'national-decimo') return [];
    return getUpcomingPlayableDraws(activeGame, now, 4);
  }, [activeGame, game.drawDays, game.model, now]);
  const selectedDraw = useMemo(() => drawOptions.find(draw => draw.drawDateKey === selectedDrawKey) || drawOptions[0] || null, [drawOptions, selectedDrawKey]);
  const historyStore = useGameHistory(auth.user);
  const { history } = historyStore;

  useEffect(() => {
    document.title = `${VIEW_TITLES[view] || 'Primy'} · Primy`;
  }, [view]);

  useEffect(() => {
    if (!hasUnsavedGeneratedPlay || view !== 'generate') return undefined;
    const handleBeforeUnload = event => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedGeneratedPlay, view]);

  useEffect(() => {
    if (!auth.notice) return;
    showToast(auth.notice);
    auth.clearNotice();
  }, [auth.notice, auth.clearNotice, showToast]);

  useEffect(() => {
    if (defaultGameAppliedRef.current || !preferences.defaultGame) return;
    defaultGameAppliedRef.current = true;
    setActiveGame(preferences.defaultGame);
  }, [preferences.defaultGame]);

  useEffect(() => {
    if (!drawOptions.length) {
      if (selectedDrawKey) setSelectedDrawKey('');
      return;
    }
    if (!drawOptions.some(draw => draw.drawDateKey === selectedDrawKey)) setSelectedDrawKey(drawOptions[0].drawDateKey);
  }, [drawOptions, selectedDrawKey]);

  const selectGameImmediate = useCallback(gameId => {
    if (!GAMES[gameId]) return;
    generation.cancel({ announce: false });
    generation.resetResult();
    const selectedGame = getGameConfig(gameId);
    setActiveGame(gameId);
    setBetType('simple');
    setSystemSize(7);
    setSelectedDrawKey('');
    setColumnCount(current => Math.max(selectedGame.minSimpleBets || 1, Math.min(current, selectedGame.maxSimpleBets || 1)));
    setVariantContext(current => current?.gameId === gameId ? current : null);
  }, [generation]);

  const selectGame = useCallback(gameId => {
    if (!GAMES[gameId]) return;
    if (hasUnsavedGeneratedPlay && gameId !== activeGame) {
      setPendingUnsavedAction({ type: 'game', gameId });
      return;
    }
    selectGameImmediate(gameId);
  }, [activeGame, hasUnsavedGeneratedPlay, selectGameImmediate]);

  const openGenerate = useCallback(gameId => {
    if (gameId) selectGame(gameId);
    navigate('generate');
  }, [navigate, selectGame]);

  const generate = useCallback(() => {
    generation.generate({ activeGame, columnCount, variantContext, betType, systemSize, drawInfo: selectedDraw });
  }, [generation, activeGame, columnCount, variantContext, betType, systemSize, selectedDraw]);

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

  const prepareQuinigol = useCallback(config => {
    try {
      const play = createSimpleQuinigolPlay(config || {});
      generation.setLatest(play);
      generation.setSaveState('unsaved');
      generation.setGenerationError('');
    } catch (error) {
      generation.setGenerationError(error?.message || 'No se ha podido preparar El Quinigol.');
    }
  }, [generation]);

  const prepareLototurf = useCallback(config => {
    try {
      const play = createLototurfPlay(config || {});
      generation.setLatest(play);
      generation.setSaveState('unsaved');
      generation.setGenerationError('');
    } catch (error) {
      generation.setGenerationError(error?.message || 'No se ha podido preparar Lototurf.');
    }
  }, [generation]);

  const prepareQuintuplePlus = useCallback(config => {
    try {
      const play = createQuintuplePlusPlay(config || {});
      generation.setLatest(play);
      generation.setSaveState('unsaved');
      generation.setGenerationError('');
    } catch (error) {
      generation.setGenerationError(error?.message || 'No se ha podido preparar Quíntuple Plus.');
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

  const requestDiscardLatest = useCallback(() => {
    if (hasUnsavedGeneratedPlay) {
      setPendingUnsavedAction({ type: 'discard' });
      return;
    }
    playActions.discardLatest();
  }, [hasUnsavedGeneratedPlay, playActions]);

  const requestSignOut = useCallback(() => {
    if (hasUnsavedGeneratedPlay && view === 'generate') {
      setPendingUnsavedAction({ type: 'signout' });
      return;
    }
    auth.signOut();
  }, [auth, hasUnsavedGeneratedPlay, view]);

  const closeUnsavedGenerationConfirm = useCallback(() => setPendingUnsavedAction(null), []);

  const confirmUnsavedGenerationLoss = useCallback(() => {
    const action = pendingUnsavedAction;
    if (!action) return;
    setPendingUnsavedAction(null);

    if (action.type === 'discard') {
      playActions.discardLatest();
      return;
    }
    if (action.type === 'game') {
      selectGameImmediate(action.gameId);
      return;
    }

    generation.resetResult();
    setVariantContext(null);
    if (action.type === 'navigate') {
      routerNavigate(action.nextView, { force: true });
      return;
    }
    if (action.type === 'signout') auth.signOut();
  }, [auth, generation, pendingUnsavedAction, playActions, routerNavigate, selectGameImmediate]);

  const dueByGame = useMemo(() => getDueByGame(history), [history]);
  const dueTotal = useMemo(() => getDueTotal(dueByGame), [dueByGame]);
  const monthlyStats = useMemo(() => getMonthlyStats(history, now), [history, now]);
  const totals = useMemo(() => getPurchasedTotals(history), [history]);

  useDueNotifications({ enabled: preferences.notifications, dueCount: dueTotal });

  const { checkingGame, checkingPlayId, checkGame, checkPlay, checkAll } = useResultChecking({
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
      drawOptions,
      selectedDrawKey: selectedDraw?.drawDateKey || '',
      onDrawChange: setSelectedDrawKey,
      onGenerate: generate,
      onPrepareNational: prepareNational,
      onPrepareQuiniela: prepareQuiniela,
      onPrepareQuinigol: prepareQuinigol,
      onPrepareLototurf: prepareLototurf,
      onPrepareQuintuplePlus: prepareQuintuplePlus,
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
      onDiscard: requestDiscardLatest,
      onOpenPlays: () => navigate('plays'),
      onToast: showToast,
      variantLabel: variantContext?.label || '',
      onClearVariant: () => setVariantContext(null),
    },
    plays: {
      now,
      plays: history,
      dueByGame,
      verificationError: historyStore.verificationError,
      checkingGame,
      checkingPlayId,
      onCheck: checkGame,
      onCheckPlay: checkPlay,
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
      onSignOut: requestSignOut,
      onDeleteAccount: auth.deleteAccount,
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
      onSignOut: requestSignOut,
      syncStatus: historyStore.syncStatus,
      lastSyncedAt: historyStore.lastSyncedAt,
      pendingSyncCount: historyStore.pendingSyncCount,
    },
    propsByView,
    overlays: {
      manual: {
        open: manualOpen,
        initialGame: ['quiniela', 'quinigol', 'lototurf', 'quintuple-plus'].includes(activeGame) ? 'primitiva' : activeGame,
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
      unsavedGenerationConfirm: {
        open: Boolean(pendingUnsavedAction),
        onClose: closeUnsavedGenerationConfirm,
        onConfirm: confirmUnsavedGenerationLoss,
        title: '¿Salir sin guardar esta jugada?',
        description: 'Los números que Primy acaba de generar todavía no están guardados ni registrados. Si continúas, se perderán.',
        confirmLabel: 'Salir y perder los números',
        cancelLabel: 'Seguir revisando',
        tone: 'danger',
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
