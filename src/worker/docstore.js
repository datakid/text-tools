const MAX_BYTES = 512 * 1024 * 1024;

const sets = new Map();
const order = [];
let totalBytes = 0;

function sizeOf(docs) {
  let bytes = 0;
  for (const d of docs) bytes += d.text.length * 2;
  return bytes;
}

export function put(key, docs) {
  if (sets.has(key)) {
    totalBytes -= sizeOf(sets.get(key));
    order.splice(order.indexOf(key), 1);
  }
  sets.set(key, docs);
  order.push(key);
  totalBytes += sizeOf(docs);
  evict();
}

function evict() {
  while (totalBytes > MAX_BYTES && order.length > 1) {
    const oldest = order.shift();
    totalBytes -= sizeOf(sets.get(oldest));
    sets.delete(oldest);
  }
}

export function get(key) {
  return sets.get(key);
}

export function stats() {
  return { count: sets.size, bytes: totalBytes, budget: MAX_BYTES };
}

export function clear() {
  sets.clear();
  order.length = 0;
  totalBytes = 0;
}
