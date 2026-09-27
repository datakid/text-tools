import { nanoid } from '../core/id.js';
import * as persist from '../core/persist.js';

const DEBOUNCE_MS = 90;

let debounceTimer = null;
let activeJob = null;

export function triggerPreview(store, engine) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runPreview(store, engine), DEBOUNCE_MS);
}

async function runPreview(store, engine) {
  const state = store.get();
  if (!state.docSetKey) return;
  if (activeJob) engine.cancel(activeJob.id);

  const { workflow } = state;
  const start = performance.now();
  const job = engine.preview(state.docSetKey, workflow.steps, workflow.params);
  activeJob = job;

  try {
    const result = await job.promise;
    if (activeJob !== job) return;
    store.set({
      previewDocSetKey: result.docSetKey,
      docsMeta: result.docsMeta,
      stats: result.stats,
      errors: result.errors || [],
      lastRunMs: Math.round(performance.now() - start),
      previewMode: true
    });
  } catch (e) {
    if (activeJob !== job) return;
    store.set({ errors: [{ message: e.message }] });
  }
}

export async function triggerRun(store, engine, overrides = {}) {
  const state = store.get();
  if (!state.docSetKey) return;

  const { workflow } = state;
  const start = performance.now();
  const job = engine.run(state.docSetKey, workflow.steps, workflow.params, overrides);
  activeJob = job;

  try {
    const result = await job.promise;
    if (activeJob !== job) return;
    store.set({
      runDocSetKey: result.docSetKey,
      docsMeta: result.docsMeta,
      stats: result.stats,
      errors: result.errors || [],
      lastRunMs: Math.round(performance.now() - start),
      previewMode: false
    });
    if (!result.errors || result.errors.length === 0) {
      persist
        .saveRun({
          id: `run_${nanoid()}`,
          workflowId: workflow.meta.id,
          timestamp: Date.now(),
          workflow: JSON.parse(JSON.stringify(workflow)),
          overrides,
          stats: result.stats
        })
        .catch(() => {});
    }
  } catch (e) {
    if (activeJob !== job) return;
    store.set({ errors: [{ message: e.message }] });
  }
}
