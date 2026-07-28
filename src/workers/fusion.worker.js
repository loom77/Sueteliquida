import { generateFusionPlay } from '../utils/fusionEngine.js';

self.onmessage = event => {
  const { requestId, gameId, analysis, columnCount, samples, avoidColumns, variantOf } = event.data || {};
  try {
    const play = generateFusionPlay(gameId, analysis, columnCount, {
      samples,
      avoidColumns,
      variantOf,
      onProgress: progress => self.postMessage({ type: 'progress', requestId, progress }),
    });
    self.postMessage({ type: 'done', requestId, play });
  } catch (error) {
    self.postMessage({ type: 'error', requestId, message: error?.message || 'Error durante la generación.' });
  }
};
