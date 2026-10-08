import { readJSON, writeJSON } from './env.js';
import { MANIFEST } from '../ops/index.js';

const FAV_KEY = 'sluice.favorites';
const RECENT_KEY = 'sluice.recent';
const RECENT_MAX = 12;
const listeners = new Set();

function valid(ids) {
  return Array.isArray(ids) ? ids.filter((id) => MANIFEST.some((m) => m.id === id)) : [];
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function onPrefsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getFavorites() {
  return valid(readJSON(FAV_KEY, []));
}

export function isFavorite(id) {
  return getFavorites().includes(id);
}

export function toggleFavorite(id) {
  const favs = getFavorites();
  const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
  writeJSON(FAV_KEY, next);
  emit();
  return next.includes(id);
}

export function getRecent() {
  return valid(readJSON(RECENT_KEY, []));
}

export function pushRecent(id) {
  const next = [id, ...getRecent().filter((r) => r !== id)].slice(0, RECENT_MAX);
  writeJSON(RECENT_KEY, next);
  emit();
}
