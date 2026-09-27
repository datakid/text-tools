import { createStore } from './core/store.js';
import { createEngine } from './core/engine.js';
import { createWorkflow } from './core/workflow.js';
import { mountShell } from './ui/shell.js';
import { wireHistory } from './ui/historyController.js';
import * as persist from './core/persist.js';
import { migrate } from './core/workflow.js';
import { ingestText } from './ui/ingest.js';

async function boot() {
  let workflow = createWorkflow('Untitled workflow');
  try {
    const saved = await persist.getPref('currentWorkflow');
    if (saved) workflow = migrate(saved);
  } catch (e) {}

  let theme = null;
  try { theme = localStorage.getItem('sluice.theme'); } catch {}
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
    stats: null,
    errors: [],
    lastRunMs: null
  });

  const engine = createEngine(new URL('./worker/run.worker.js', import.meta.url));
  const historyController = wireHistory(store);
  engine.bus.on('restart', () => {
    const input = document.querySelector('#input-text');
    if (input) ingestText(store, engine, input.value);
  });

  let saveTimer = null;
  store.subscribe((state, changed) => {
    if (changed.includes('theme')) {
      try { localStorage.setItem('sluice.theme', state.theme); } catch {}
    }
    if (!changed.includes('workflow')) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persist.setPref('currentWorkflow', state.workflow).catch(() => {});
    }, 500);
  });

  mountShell(document.getElementById('app'), store, engine, historyController);
}

boot().catch((error) => {
  const root = document.getElementById('app');
  root.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'boot-error';
  box.textContent = `Sluice could not start: ${error.message}. Reload the page to try again.`;
  root.appendChild(box);
});
