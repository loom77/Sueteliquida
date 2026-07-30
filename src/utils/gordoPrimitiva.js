export const GORDO_SYSTEM_BETS = Object.freeze({
  6: 6,
  7: 21,
});

export const GORDO_SYSTEM_SIZES = Object.freeze(Object.keys(GORDO_SYSTEM_BETS).map(Number));

export function gordoEquivalentBets(selectionSize) {
  return GORDO_SYSTEM_BETS[Number(selectionSize)] || 0;
}

export function isGordoSystemSize(selectionSize) {
  return gordoEquivalentBets(selectionSize) > 0;
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

export function expandGordoSystem(selection) {
  const numbers = [...new Set((selection || []).map(Number).filter(Number.isInteger))]
    .filter(number => number >= 1 && number <= 54)
    .sort((left, right) => left - right);
  if (!isGordoSystemSize(numbers.length)) {
    throw new Error('La múltiple de El Gordo debe contener 6 o 7 números distintos.');
  }
  return combinations(numbers, 5);
}
