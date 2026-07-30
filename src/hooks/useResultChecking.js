import { useCallback, useState } from 'react';
import { GAMES } from '../utils/gameConfig.js';

export function useResultChecking({ dueByGame, checkResults, showToast }) {
  const [checkingGame, setCheckingGame] = useState('');

  const checkGame = useCallback(async gameId => {
    setCheckingGame(gameId);
    try {
      const result = await checkResults(gameId);
      if (result.checked > 0) showToast(`${result.checked} ${result.checked === 1 ? 'jugada comprobada' : 'jugadas comprobadas'}.`);
      else if (!result.error) showToast('No se han encontrado resultados nuevos que aplicar.');
      return result;
    } finally {
      setCheckingGame('');
    }
  }, [checkResults, showToast]);

  const checkAll = useCallback(async () => {
    setCheckingGame('all');
    let checked = 0;
    let firstError = '';
    try {
      for (const gameId of Object.keys(GAMES)) {
        if (!dueByGame[gameId]) continue;
        const result = await checkResults(gameId);
        checked += result.checked || 0;
        firstError ||= result.error || '';
      }
      showToast(firstError || (checked
        ? `${checked} ${checked === 1 ? 'jugada comprobada' : 'jugadas comprobadas'}.`
        : 'No se han encontrado resultados nuevos que aplicar.'));
    } finally {
      setCheckingGame('');
    }
  }, [checkResults, dueByGame, showToast]);

  return { checkingGame, checkGame, checkAll };
}
