import { QUINIELA_SYMBOLS } from './constants.js';
import { normalizeDistribution } from './probability.js';

const MIN_PROBABILITY = 1e-15;

function validateRows(rows, labels) {
  if (!Array.isArray(rows) || rows.length === 0) throw new RangeError('La evaluación necesita predicciones cerradas.');
  return rows.map((row, index) => {
    if (!labels.includes(row?.outcome)) throw new RangeError(`El resultado real de la fila ${index + 1} no es válido.`);
    const probabilities = normalizeDistribution(Object.fromEntries(labels.map(label => [label, row?.probabilities?.[label] || 0])));
    return { ...row, probabilities };
  });
}

export function multiclassLogLoss(rows, labels = QUINIELA_SYMBOLS) {
  const clean = validateRows(rows, labels);
  return clean.reduce((sum, row) => sum - Math.log(Math.max(MIN_PROBABILITY, row.probabilities[row.outcome])), 0) / clean.length;
}

export function multiclassBrierScore(rows, labels = QUINIELA_SYMBOLS) {
  const clean = validateRows(rows, labels);
  return clean.reduce((sum, row) => sum + labels.reduce((rowSum, label) => {
    const observed = row.outcome === label ? 1 : 0;
    return rowSum + ((row.probabilities[label] - observed) ** 2);
  }, 0), 0) / clean.length;
}

export function calibrationBins(rows, { label = '1', labels = QUINIELA_SYMBOLS, bins = 10 } = {}) {
  if (!labels.includes(label)) throw new RangeError('La clase de calibración no pertenece al modelo.');
  if (!Number.isInteger(bins) || bins < 2 || bins > 50) throw new RangeError('bins debe estar entre 2 y 50.');
  const clean = validateRows(rows, labels);
  const result = Array.from({ length: bins }, (_, index) => ({
    bin: index,
    min: index / bins,
    max: (index + 1) / bins,
    count: 0,
    predictedSum: 0,
    observedSum: 0,
  }));
  for (const row of clean) {
    const probability = row.probabilities[label];
    const index = Math.min(bins - 1, Math.floor(probability * bins));
    const bin = result[index];
    bin.count += 1;
    bin.predictedSum += probability;
    bin.observedSum += row.outcome === label ? 1 : 0;
  }
  return result.map(bin => ({
    bin: bin.bin,
    min: bin.min,
    max: bin.max,
    count: bin.count,
    meanPredicted: bin.count ? bin.predictedSum / bin.count : null,
    observedFrequency: bin.count ? bin.observedSum / bin.count : null,
  }));
}

export function temporalLeakageIssues(snapshots, matches) {
  const kickoffById = new Map((matches || []).map(match => [String(match.matchId || match.id), Date.parse(match.kickoffAt)]));
  const issues = [];
  for (const snapshot of snapshots || []) {
    const matchId = String(snapshot.matchId || '');
    const kickoff = kickoffById.get(matchId);
    const generatedAt = Date.parse(snapshot.generatedAt);
    const dataCutoffAt = Date.parse(snapshot.dataCutoffAt);
    if (!Number.isFinite(kickoff)) {
      issues.push({ matchId, code: 'MISSING_KICKOFF', message: 'No existe una hora oficial para comprobar el corte temporal.' });
      continue;
    }
    if (!Number.isFinite(dataCutoffAt)) issues.push({ matchId, code: 'MISSING_DATA_CUTOFF', message: 'El snapshot no declara hasta cuándo conoce datos.' });
    else if (dataCutoffAt >= kickoff) issues.push({ matchId, code: 'DATA_AFTER_KICKOFF', message: 'El modelo utiliza datos iguales o posteriores al inicio del partido.' });
    if (!Number.isFinite(generatedAt)) issues.push({ matchId, code: 'INVALID_GENERATED_AT', message: 'La fecha de generación no es válida.' });
    else if (generatedAt >= kickoff) issues.push({ matchId, code: 'PREDICTION_AFTER_KICKOFF', message: 'La predicción se generó cuando el partido ya había empezado.' });
  }
  return issues;
}
