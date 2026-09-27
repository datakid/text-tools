import { MANIFEST } from '../ops/index.js';

const cache = new Map();

export function listGroups() {
  const groups = new Map();
  for (const entry of MANIFEST) {
    if (!groups.has(entry.group)) groups.set(entry.group, []);
    groups.get(entry.group).push(entry);
  }
  return groups;
}

export function listAll() {
  return MANIFEST.slice();
}

export function findManifest(id) {
  return MANIFEST.find(m => m.id === id);
}

export async function get(id) {
  if (cache.has(id)) return cache.get(id);
  const entry = findManifest(id);
  if (!entry) throw new Error(`Unknown op: ${id}`);
  const mod = await entry.load();
  const op = mod.default;
  cache.set(id, op);
  return op;
}
