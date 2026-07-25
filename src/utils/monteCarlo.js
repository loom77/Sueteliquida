import { getGameConfig } from './gameConfig.js';

// NOTA: questa simulazione usa Math.random() perché serve solo a generare
// dati sintetici per un esperimento statistico, non giocate reali per
// l'utente (per quelle si usa sempre crypto.getRandomValues in engine.js).
function simulateDraw(poolMax, pick) {
    const pool = Array.from({ length: poolMax }, (_, i) => i + 1);
    const result = [];
    for (let i = 0; i < pick; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        result.push(pool.splice(idx, 1)[0]);
    }
    return result;
}

/**
 * Esperimento Monte Carlo: verifica se i numeri "caldi" (i più frequenti)
 * osservati in una prima metà di estrazioni indipendenti hanno un reale
 * potere predittivo sulla seconda metà, indipendente dalla prima.
 *
 * Ipotesi nulla (H0): la lotteria è uniforme e senza memoria, quindi il
 * tasso di comparsa dei numeri "caldi" nella seconda metà deve essere
 * statisticamente indistinguibile dal tasso atteso per puro caso.
 */
/**
 * Restituisce i topK numeri più frequenti su totalDraws estrazioni simulate.
 * ATTENZIONE: questo NON aumenta le probabilità di vincita reali — vedi
 * runHotColdExperiment sopra, che dimostra che il tasso di comparsa di
 * questi numeri in estrazioni successive è statisticamente identico al
 * caso puro. Usato solo per alimentare la "modalità Monte Carlo" opzionale
 * del generatore, con disclaimer sempre visibile in UI.
 */
export function getHotNumbers(gameId, totalDraws = 20000, topK = 18) {
    const game = getGameConfig(gameId);
    const { numberPoolMax: poolMax, numbersToPick: pick } = game;
    const freq = new Array(poolMax + 1).fill(0);

    for (let d = 0; d < totalDraws; d++) {
        simulateDraw(poolMax, pick).forEach((n) => { freq[n]++; });
    }

    return freq
        .map((count, num) => ({ num, count }))
        .filter((x) => x.num >= 1)
        .sort((a, b) => b.count - a.count)
        .slice(0, topK)
        .map((x) => x.num);
}

export function runHotColdExperiment(gameId, totalDraws = 20000, hotPoolSize = 10) {
    const game = getGameConfig(gameId);
    const { numberPoolMax: poolMax, numbersToPick: pick } = game;

    const half = Math.floor(totalDraws / 2);
    const freqFirstHalf = new Array(poolMax + 1).fill(0);
    const freqAll = new Array(poolMax + 1).fill(0);
    const secondHalfDraws = [];

    for (let d = 0; d < totalDraws; d++) {
        const draw = simulateDraw(poolMax, pick);
        draw.forEach((n) => { freqAll[n]++; });
        if (d < half) {
            draw.forEach((n) => { freqFirstHalf[n]++; });
        } else {
            secondHalfDraws.push(draw);
        }
    }

    // top K numeri più frequenti nella PRIMA metà = "numeri caldi"
    const hotNumbers = freqFirstHalf
        .map((count, num) => ({ num, count }))
        .filter((x) => x.num >= 1)
        .sort((a, b) => b.count - a.count)
        .slice(0, hotPoolSize)
        .map((x) => x.num);

    const hotSet = new Set(hotNumbers);

    // quante volte un numero "caldo" compare nelle estrazioni della SECONDA metà
    let hotHitsTotal = 0;
    secondHalfDraws.forEach((draw) => {
        draw.forEach((n) => { if (hotSet.has(n)) hotHitsTotal++; });
    });

    const totalNumbersDrawnSecondHalf = secondHalfDraws.length * pick;
    const observedHotHitRate = hotHitsTotal / totalNumbersDrawnSecondHalf;

    // tasso atteso per puro caso: probabilità che un numero estratto
    // appartenga a uno dei K numeri "caldi" su un pool di poolMax numeri
    const expectedHotHitRate = hotPoolSize / poolMax;

    const diffPct = ((observedHotHitRate - expectedHotHitRate) / expectedHotHitRate) * 100;

    // errore standard di una proporzione binomiale, per stabilire se lo
    // scarto osservato è dentro il rumore campionario (~95% con 2 SE)
    const n = totalNumbersDrawnSecondHalf;
    const p = expectedHotHitRate;
    const standardError = Math.sqrt((p * (1 - p)) / n);
    const withinNoise = Math.abs(observedHotHitRate - expectedHotHitRate) <= 2 * standardError;

    return {
        gameId,
        totalDraws,
        hotNumbers,
        observedHotHitRate,
        expectedHotHitRate,
        diffPct,
        standardError,
        withinNoise,
        freqAll: freqAll.slice(1), // indice 0 non usato (numeri partono da 1)
        poolMax,
    };
}
