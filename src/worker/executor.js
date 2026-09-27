import { fnv1a64, hashChain } from '../core/hash.js';
import { get as getOp } from '../core/registry.js';
import { resolveParams } from '../core/workflow.js';
import { coerce, defaults } from '../core/schema.js';
import { OpError } from '../core/result.js';

const MAX_CACHE_BYTES = 512 * 1024 * 1024;

const cache = new Map();
const order = [];
let cacheBytes = 0;

function sizeOfDocs(docs) {
  let bytes = 0;
  for (const d of docs) bytes += d.text.length * 2;
  return bytes;
}

function remember(key, docs) {
  if (cache.has(key)) {
    order.splice(order.indexOf(key), 1);
    cacheBytes -= sizeOfDocs(cache.get(key));
  }
  cache.set(key, docs);
  order.push(key);
  cacheBytes += sizeOfDocs(docs);
  while (cacheBytes > MAX_CACHE_BYTES && order.length > 1) {
    const oldest = order.shift();
    cacheBytes -= sizeOfDocs(cache.get(oldest));
    cache.delete(oldest);
  }
}

function hashDocs(docs) {
  return fnv1a64(docs.map(d => `${d.id}:${fnv1a64(d.text)}`).join(','));
}

function makeCtx({ onProgress, onLog, isCancelled, stepIndex, total }) {
  return {
    progress(fraction) {
      onProgress?.((stepIndex + fraction) / total);
    },
    throwIfCancelled() {
      if (isCancelled?.()) throw new OpError('cancelled', 'Run cancelled');
    },
    log(msg) {
      onLog?.({ level: 'info', msg });
    },
    warn(msg) {
      onLog?.({ level: 'warn', msg });
    },
    resolveTemplate(str, scope = {}) {
      return str.replace(/\{\{(\w+)\}\}/g, (m, k) => (scope[k] !== undefined ? scope[k] : m));
    },
    rng(seed) {
      let s = (seed >>> 0) || 1;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
    }
  };
}

export async function runChain(inputDocs, steps, workflowParams, opts = {}) {
  const { onProgress, onLog, isCancelled, sample, overrides = {} } = opts;
  let docs = sample ? inputDocs.map(d => ({ ...d, text: d.text.slice(0, sample) })) : inputDocs;
  let key = hashDocs(docs);
  const errors = [];
  const enabledSteps = steps.filter(s => s.enabled);
  const total = enabledSteps.length || 1;

  for (let i = 0; i < enabledSteps.length; i++) {
    const step = enabledSteps[i];
    if (isCancelled?.()) throw new OpError('cancelled', 'Run cancelled');

    let op;
    try {
      op = await getOp(step.op);
    } catch (e) {
      errors.push({ stepId: step.id, message: e.message });
      continue;
    }

    if (sample && op.previewFidelity === 'none') {
      errors.push({ stepId: step.id, message: `${op.name} is not previewed on a sample`, hint: 'Run to see result' });
      continue;
    }

    const resolved = resolveParams(step.params, workflowParams, overrides);
    const paramValues = coerce(op.params, { ...defaults(op.params), ...resolved });
    key = hashChain(key, step.op, JSON.stringify(paramValues));

    if (cache.has(key)) {
      docs = cache.get(key);
      order.splice(order.indexOf(key), 1);
      order.push(key);
      onProgress?.((i + 1) / total);
      continue;
    }

    const ctx = makeCtx({ onProgress, onLog, isCancelled, stepIndex: i, total });
    try {
      docs = await op.run(docs, paramValues, ctx);
    } catch (e) {
      errors.push({ stepId: step.id, message: e.message, code: e.code, hint: e.hint });
      break;
    }
    remember(key, docs);
  }

  return { docs, key, errors };
}

export function clearCache() {
  cache.clear();
  order.length = 0;
  cacheBytes = 0;
}

export function cacheStats() {
  return { entries: cache.size, bytes: cacheBytes, budget: MAX_CACHE_BYTES };
}
