let ephemeral = false;
try {
  ephemeral = typeof location !== 'undefined' && new URLSearchParams(location.search).has('e2e');
} catch {}

const memory = new Map();

export function isEphemeral() {
  return ephemeral;
}

export function setEphemeral(value) {
  ephemeral = Boolean(value);
}

export function readLocal(key, fallback = null) {
  if (ephemeral) return memory.has(key) ? memory.get(key) : fallback;
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function writeLocal(key, value) {
  if (ephemeral) {
    if (value == null) memory.delete(key);
    else memory.set(key, String(value));
    return;
  }
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch {}
}

export function readJSON(key, fallback) {
  const raw = readLocal(key, null);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  writeLocal(key, JSON.stringify(value));
}
