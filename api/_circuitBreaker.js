const states = new Map();

export function circuitState(name) {
  return states.get(name) || { failures: 0, openedUntil: 0 };
}

export function assertCircuitClosed(name, { now = Date.now() } = {}) {
  const state = circuitState(name);
  if (state.openedUntil > now) {
    const error = new Error('Servicio externo suspendido temporalmente tras errores repetidos.');
    error.code = 'CIRCUIT_OPEN';
    error.retryAfter = Math.ceil((state.openedUntil - now) / 1000);
    throw error;
  }
}

export function recordCircuitSuccess(name) {
  states.set(name, { failures: 0, openedUntil: 0 });
}

export function recordCircuitFailure(name, {
  threshold = 4,
  cooldownMs = 30000,
  now = Date.now(),
} = {}) {
  const current = circuitState(name);
  const failures = current.failures + 1;
  states.set(name, {
    failures,
    openedUntil: failures >= threshold ? now + cooldownMs : 0,
  });
}

export function resetCircuit(name) {
  states.delete(name);
}
