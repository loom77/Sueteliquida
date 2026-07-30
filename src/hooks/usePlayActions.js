import { useCallback } from 'react';
import { getNextDrawInfo } from '../utils/drawSchedule.js';
import { getGameConfig } from '../utils/gameConfig.js';
import { createId } from '../utils/createId.js';

export function usePlayActions({
  history,
  savePlay,
  markPurchased,
  removePlay,
  restorePlay,
  generation,
  navigate,
  showToast,
  setActiveGame,
  setColumnCount,
  setVariantContext,
  setManualOpen,
}) {
  const saveLatest = useCallback(purchased => {
    if (!generation.latest) return;
    const original = generation.latest;
    const stored = savePlay(original, { purchased });
    if (!stored) return;
    generation.setLatest(stored);
    generation.setSaveState(purchased ? 'purchased' : 'draft');
    setVariantContext(null);
    showToast(purchased ? {
      message: 'Jugada registrada. Primy te avisará cuando esté lista para comprobarla.',
      actionLabel: 'Deshacer registro',
      duration: 12_000,
      action: () => {
        removePlay(stored.id);
        generation.setLatest(original);
        generation.setSaveState('unsaved');
      },
    } : 'Borrador guardado en tus jugadas.');
  }, [generation, removePlay, savePlay, setVariantContext, showToast]);

  const discardLatest = useCallback(() => {
    generation.resetResult();
    setVariantContext(null);
  }, [generation, setVariantContext]);

  const removeWithUndo = useCallback(id => {
    const play = history.find(item => item.id === id);
    if (!play) return;
    removePlay(id);
    showToast({
      message: 'Jugada eliminada.',
      actionLabel: 'Deshacer',
      duration: 12_000,
      action: () => restorePlay(play),
    });
  }, [history, removePlay, restorePlay, showToast]);

  const purchaseExisting = useCallback(id => {
    markPurchased(id);
    showToast('Jugada registrada como comprada.');
  }, [markPurchased, showToast]);

  const saveExternal = useCallback(play => {
    const stored = savePlay(play, { purchased: true });
    if (!stored) return;
    setManualOpen(false);
    showToast('Boleto externo añadido a tus jugadas.');
    navigate('plays');
  }, [navigate, savePlay, setManualOpen, showToast]);

  const repeatExact = useCallback(play => {
    const draw = getNextDrawInfo(play.gameId);
    const repeated = {
      ...play,
      id: createId('play'),
      columns: play.columns.map((column, index) => ({
        ...column,
        id: createId('column'),
        index: index + 1,
        status: 'draft',
        prizeCategory: undefined,
        prizeDisplay: undefined,
        officialPrize: undefined,
        matches: undefined,
        secondaryMatches: undefined,
        payoutType: undefined,
        extraMatch: undefined,
        complementaryMatch: undefined,
      })),
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
    generation.setLatest(repeated);
    generation.setSaveState('unsaved');
    generation.setGenerationError('');
    navigate('generate');
  }, [generation, navigate, setActiveGame, setColumnCount, setVariantContext]);

  const createVariant = useCallback(play => {
    setActiveGame(play.gameId);
    setColumnCount(play.columns.length);
    generation.resetResult();
    setVariantContext({
      id: play.id,
      gameId: play.gameId,
      columns: play.columns,
      label: `${getGameConfig(play.gameId).shortName} del ${new Intl.DateTimeFormat('es-ES').format(new Date(play.createdAt))}`,
    });
    navigate('generate');
  }, [generation, navigate, setActiveGame, setColumnCount, setVariantContext]);

  return {
    saveLatest,
    discardLatest,
    removeWithUndo,
    purchaseExisting,
    saveExternal,
    repeatExact,
    createVariant,
  };
}
