import { isEphemeral } from './env.js';

const DB_NAME = 'sluice';
const DB_VERSION = 1;

let dbPromise = null;
const memory = { workflows: new Map(), runs: new Map(), prefs: new Map() };

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('workflows')) db.createObjectStore('workflows', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('runs')) db.createObjectStore('runs', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('prefs')) db.createObjectStore('prefs', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getDB() {
  if (!dbPromise) dbPromise = openDB();
  return dbPromise;
}

async function withStore(name, mode) {
  const db = await getDB();
  return db.transaction(name, mode).objectStore(name);
}

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function clone(v) {
  return v === undefined ? v : JSON.parse(JSON.stringify(v));
}

export async function saveWorkflow(workflow) {
  const row = { id: workflow.meta.id, workflow, updated: Date.now() };
  if (isEphemeral()) {
    memory.workflows.set(row.id, clone(row));
    return workflow;
  }
  const store = await withStore('workflows', 'readwrite');
  await request(store.put(row));
  return workflow;
}

export async function listWorkflows() {
  const rows = isEphemeral() ? [...memory.workflows.values()].map(clone) : await request((await withStore('workflows', 'readonly')).getAll());
  return rows.sort((a, b) => b.updated - a.updated);
}

export async function getWorkflow(id) {
  if (isEphemeral()) return clone(memory.workflows.get(id)?.workflow) || null;
  const store = await withStore('workflows', 'readonly');
  const row = await request(store.get(id));
  return row ? row.workflow : null;
}

export async function deleteWorkflow(id) {
  if (isEphemeral()) {
    memory.workflows.delete(id);
    return;
  }
  const store = await withStore('workflows', 'readwrite');
  await request(store.delete(id));
}

export async function saveRun(entry) {
  if (isEphemeral()) {
    memory.runs.set(entry.id, clone(entry));
    return;
  }
  const store = await withStore('runs', 'readwrite');
  await request(store.put(entry));
}

export async function listRuns(workflowId, limit = 20) {
  const rows = isEphemeral() ? [...memory.runs.values()].map(clone) : await request((await withStore('runs', 'readonly')).getAll());
  return rows
    .filter((r) => r.workflowId === workflowId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export async function setPref(key, value) {
  if (isEphemeral()) {
    memory.prefs.set(key, clone(value));
    return;
  }
  const store = await withStore('prefs', 'readwrite');
  await request(store.put({ key, value }));
}

export async function getPref(key) {
  if (isEphemeral()) return clone(memory.prefs.get(key));
  const store = await withStore('prefs', 'readonly');
  const row = await request(store.get(key));
  return row ? row.value : undefined;
}
