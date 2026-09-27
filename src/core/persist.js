const DB_NAME = 'sluice';
const DB_VERSION = 1;

let dbPromise = null;

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

export async function saveWorkflow(workflow) {
  const store = await withStore('workflows', 'readwrite');
  await request(store.put({ id: workflow.meta.id, workflow, updated: Date.now() }));
  return workflow;
}

export async function listWorkflows() {
  const store = await withStore('workflows', 'readonly');
  const rows = await request(store.getAll());
  return rows.sort((a, b) => b.updated - a.updated);
}

export async function getWorkflow(id) {
  const store = await withStore('workflows', 'readonly');
  const row = await request(store.get(id));
  return row ? row.workflow : null;
}

export async function deleteWorkflow(id) {
  const store = await withStore('workflows', 'readwrite');
  await request(store.delete(id));
}

export async function saveRun(entry) {
  const store = await withStore('runs', 'readwrite');
  await request(store.put(entry));
}

export async function listRuns(workflowId, limit = 20) {
  const store = await withStore('runs', 'readonly');
  const rows = await request(store.getAll());
  return rows
    .filter((r) => r.workflowId === workflowId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export async function setPref(key, value) {
  const store = await withStore('prefs', 'readwrite');
  await request(store.put({ key, value }));
}

export async function getPref(key) {
  const store = await withStore('prefs', 'readonly');
  const row = await request(store.get(key));
  return row ? row.value : undefined;
}
