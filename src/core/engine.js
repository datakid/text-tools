import { createBus } from './bus.js';
import { nanoid } from './id.js';

const WATCHDOG_MS = 15000;

export function createEngine(workerUrl) {
  const bus = createBus();
  const pending = new Map();
  const watchdogs = new Map();
  let worker = null;

  function spawn() {
    worker = new Worker(workerUrl, { type: 'module' });
    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        bus.emit('progress', { id: msg.id, fraction: msg.fraction });
        return;
      }
      if (msg.type === 'log') {
        bus.emit('log', msg.log);
        return;
      }
      const entry = pending.get(msg.id);
      if (!entry) return;
      clearWatchdog(msg.id);
      pending.delete(msg.id);
      if (msg.ok) entry.resolve(msg.result);
      else entry.reject(new Error(msg.error));
    };
    worker.onerror = (e) => {
      e.preventDefault();
      restart(e.message || 'Worker failed');
    };
  }

  function restart(reason) {
    const stale = new Map(pending);
    pending.clear();
    watchdogs.forEach(clearTimeout);
    watchdogs.clear();
    worker.terminate();
    for (const entry of stale.values()) entry.reject(new Error(reason));
    spawn();
    bus.emit('restart', reason);
  }

  function clearWatchdog(id) {
    const t = watchdogs.get(id);
    if (t) clearTimeout(t);
    watchdogs.delete(id);
  }

  function armWatchdog(id, stepHint) {
    const t = setTimeout(() => {
      restart('Operation timed out. The worker was restarted; try smaller input or a simpler pattern.');
      bus.emit('watchdog', { id, stepHint });
    }, WATCHDOG_MS);
    watchdogs.set(id, t);
  }

  function call(type, payload) {
    const id = nanoid(10);
    const promise = new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ type, id, payload });
    });
    return { id, promise };
  }

  function watchedCall(type, payload, stepHint) {
    const id = nanoid(10);
    const promise = new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      armWatchdog(id, stepHint);
      worker.postMessage({ type, id, payload });
    });
    return { id, promise };
  }

  spawn();

  return {
    bus,
    ingest: (chunks) => call('ingest', { chunks }).promise,
    preview: (docSetKey, steps, params) => watchedCall('preview', { docSetKey, steps, params }),
    run: (docSetKey, steps, params, overrides) => watchedCall('run', { docSetKey, steps, params, overrides }),
    window: (docSetKey, docIndex, from, to) => call('window', { docSetKey, docIndex, from, to }).promise,
    matches: (docSetKey, pattern, flags, limit) => watchedCall('matches', { docSetKey, pattern, flags, limit }, 'find matches'),
    diff: (docSetKey, docIndex, otherDocSetKey, otherDocIndex) =>
      watchedCall('diff', { docSetKey, docIndex, otherDocSetKey, otherDocIndex }, 'diff'),
    exportDocs: (docSetKey, mode) => call('export', { docSetKey, mode }).promise,
    cancel: (jobId) => worker.postMessage({ type: 'cancel', id: nanoid(6), payload: { jobId } }),
    terminate: () => worker.terminate()
  };
}
