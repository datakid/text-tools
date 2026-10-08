import { createStore } from './core/store.js';
import { createEngine } from './core/engine.js';
import { createWorkflow, migrate } from './core/workflow.js';
import { mountShell } from './ui/shell.js';
import { wireHistory } from './ui/historyController.js';
import * as persist from './core/persist.js';
import { readLocal, writeLocal, isEphemeral } from './core/env.js';
import { ingestText } from './ui/ingest.js';
import { triggerPreview } from './ui/previewController.js';

async function boot() {
  let workflow = createWorkflow('Untitled workflow');
  try {
    const saved = await persist.getPref('currentWorkflow');
    if (saved) workflow = migrate(saved);
  } catch (e) {}

  let theme = readLocal('sluice.theme');
  if (theme !== 'dim' && theme !== 'paper') theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dim' : 'paper';

  const store = createStore({
    theme,
    workflow,
    selectedStepId: null,
    docSetKey: null,
    previewDocSetKey: null,
    runDocSetKey: null,
    docsMeta: [],
    activeDocIndex: 0,
    previewMode: true,
    previewExact: true,
    stats: null,
    inputStats: null,
    errors: [],
    lastRunMs: null,
    busy: false
  });

  const engine = createEngine(new URL('./worker/run.worker.js', import.meta.url));
  const historyController = wireHistory(store);
  engine.bus.on('restart', () => {
    const input = document.querySelector('#input-text');
    if (input) ingestText(store, engine, input.value);
  });

  let lastSteps = JSON.stringify(workflow.steps) + JSON.stringify(workflow.params);
  let saveTimer = null;
  store.subscribe((state, changed) => {
    if (changed.includes('theme')) writeLocal('sluice.theme', state.theme);
    if (!changed.includes('workflow')) return;
    const sig = JSON.stringify(state.workflow.steps) + JSON.stringify(state.workflow.params);
    if (sig !== lastSteps) {
      lastSteps = sig;
      triggerPreview(store, engine);
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persist.setPref('currentWorkflow', state.workflow).catch(() => {});
    }, 500);
  });

  mountShell(document.getElementById('app'), store, engine, historyController);
  if (isEphemeral()) window.__sluice = { store, engine, historyController };
  document.documentElement.dataset.ready = 'true';
}

boot().catch((error) => {
  const root = document.getElementById('app');
  root.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'boot-error';
  box.textContent = `Sluice could not start: ${error.message}. Reload the page to try again.`;
  root.appendChild(box);
});
