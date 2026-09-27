export function createBus() {
  const listeners = new Map();

  function on(evt, fn) {
    if (!listeners.has(evt)) listeners.set(evt, new Set());
    listeners.get(evt).add(fn);
    return () => listeners.get(evt)?.delete(fn);
  }

  function off(evt, fn) {
    listeners.get(evt)?.delete(fn);
  }

  function emit(evt, payload) {
    listeners.get(evt)?.forEach(fn => fn(payload));
  }

  return { on, off, emit };
}
