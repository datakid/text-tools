import { runUserScript } from '../core/scriptRunner.js';

const BLOCKED = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'Worker', 'SharedWorker', 'RTCPeerConnection'];

for (const name of BLOCKED) {
  try {
    self[name] = undefined;
  } catch (e) {}
}

try {
  delete self.indexedDB;
} catch (e) {}

try {
  delete self.caches;
} catch (e) {}

if (self.navigator) {
  try {
    self.navigator.sendBeacon = undefined;
  } catch (e) {}
}

self.onmessage = (e) => {
  const { code, docs, params } = e.data;
  try {
    const result = runUserScript(code, docs, params);
    self.postMessage({ ok: true, docs: result });
  } catch (err) {
    self.postMessage({ ok: false, error: err.message });
  }
};
