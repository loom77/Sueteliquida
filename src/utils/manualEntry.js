export function parseManualSelection(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  return [...new Set(
    String(value ?? '')
      .split(/[^0-9]+/)
      .filter(Boolean)
      .map(Number)
      .filter(number => Number.isInteger(number) && number >= min && number <= max),
  )].sort((left, right) => left - right);
}

export function formatManualSelection(values) {
  return [...new Set((values || []).filter(Number.isInteger))]
    .sort((left, right) => left - right)
    .join(', ');
}

export function toggleManualSelection(value, number, {
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  limit = Number.MAX_SAFE_INTEGER,
} = {}) {
  if (!Number.isInteger(number) || number < min || number > max) return formatManualSelection(parseManualSelection(value, { min, max }));
  const selected = parseManualSelection(value, { min, max });
  if (selected.includes(number)) return formatManualSelection(selected.filter(item => item !== number));
  if (selected.length >= limit) return formatManualSelection(selected);
  return formatManualSelection([...selected, number]);
}

export function sanitizeManualSelectionText(value) {
  return String(value ?? '').replace(/[^0-9,; .-]/g, '').replace(/\s+/g, ' ').slice(0, 240);
}

export function appendManualDigit(value, digit, maxLength = 5) {
  const current = String(value ?? '').replace(/\D/g, '').slice(0, maxLength);
  const nextDigit = String(digit ?? '').replace(/\D/g, '').slice(0, 1);
  if (!nextDigit || current.length >= maxLength) return current;
  return `${current}${nextDigit}`;
}

export function removeLastManualDigit(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, -1);
}
