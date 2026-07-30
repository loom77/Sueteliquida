export const BONOLOTO_SYSTEM_BETS = Object.freeze({
  5: 44,
  7: 7,
  8: 28,
  9: 84,
  10: 210,
  11: 462,
});

export const BONOLOTO_SYSTEM_SIZES = Object.freeze(Object.keys(BONOLOTO_SYSTEM_BETS).map(Number));

export function bonolotoEquivalentBets(selectionSize) {
  return BONOLOTO_SYSTEM_BETS[Number(selectionSize)] || 0;
}

export function isBonolotoSystemSize(selectionSize) {
  return bonolotoEquivalentBets(selectionSize) > 0;
}

function combinations(values, choose) {
  const output = [];
  const current = [];
  const walk = start => {
    if (current.length === choose) {
      output.push([...current]);
      return;
    }
    const remaining = choose - current.length;
    for (let index = start; index <= values.length - remaining; index += 1) {
      current.push(values[index]);
      walk(index + 1);
      current.pop();
    }
  };
  walk(0);
  return output;
}

export function expandBonolotoSystem(selection) {
  const numbers = [...new Set((selection || []).map(Number).filter(Number.isInteger))]
    .filter(number => number >= 1 && number <= 49)
    .sort((left, right) => left - right);

  if (!isBonolotoSystemSize(numbers.length)) {
    throw new Error('La apuesta múltiple de Bonoloto debe contener 5 o entre 7 y 11 números distintos.');
  }

  if (numbers.length === 5) {
    const selected = new Set(numbers);
    return Array.from({ length: 49 }, (_, index) => index + 1)
      .filter(number => !selected.has(number))
      .map(number => [...numbers, number].sort((left, right) => left - right));
  }

  return combinations(numbers, 6);
}

export function bonolotoTicketCost({ betType = 'simple', columnCount = 0, systemSize = 0, drawCount = 1 } = {}) {
  const bets = betType === 'multiple'
    ? bonolotoEquivalentBets(systemSize)
    : Math.max(0, Number(columnCount) || 0);
  return bets * 0.5 * Math.max(1, Number(drawCount) || 1);
}
