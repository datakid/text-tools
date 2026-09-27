export function createStore(initial) {
  let state = initial;
  const subs = new Set();

  function get() {
    return state;
  }

  function set(patch) {
    const next = typeof patch === 'function' ? patch(state) : patch;
    const changed = [];
    for (const key of Object.keys(next)) {
      if (next[key] !== state[key]) changed.push(key);
    }
    if (changed.length === 0) return;
    state = { ...state, ...next };
    subs.forEach(fn => fn(state, changed));
  }

  function subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  }

  return { get, set, subscribe };
}
