import { generateFusionPlay } from '../utils/fusionEngine.js';

self.onmessage = event => {
  const { requestId, gameId, columnCount, avoidColumns, variantOf, betType, systemSize, drawInfo } = event.data || {};
  try {
    const play = generateFusionPlay(gameId, null, columnCount, {
      avoidColumns,
      variantOf,
      betType,
      systemSize,
      drawInfo,
      onProgress: progress => self.postMessage({ type: 'progress', requestId, progress }),
    });
    self.postMessage({ type: 'done', requestId, play });
  } catch (error) {
    self.postMessage({ type: 'error', requestId, message: error?.message || 'Error durante la generación.' });
  }
};
