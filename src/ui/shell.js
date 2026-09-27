import { renderStepsPane } from './stepsPane.js';
import { renderCanvasPane } from './canvasPane.js';
import { renderInspectorPane } from './inspectorPane.js';
import { renderStatusStrip } from './statusStrip.js';
import { openLibrary } from './library.js';
import { openParamsEditor } from './paramsDialog.js';
import { openRunHistory } from './runHistory.js';
import { exportWorkflow, tryParseWorkflow, readFileAsText } from './workflowFile.js';
import { ingestText } from './ingest.js';
import { alertDialog, promptDialog, confirmDialog } from './modal.js';
import { createWorkflow } from '../core/workflow.js';

export function mountShell(root, store, engine, historyController) {
  root.innerHTML = `
    <header class="app-header">
      <a class="brand" href="./" aria-label="Sluice home"><img src="icons/sluice.svg" alt="" width="22" height="22"><span>Sluice</span></a>
      <button id="wf-name" class="wf-name" type="button" title="Rename workflow"></button>
      <span style="flex:1"></span>
      <button class="btn btn-ghost mobile-pane-button" id="btn-pipeline" type="button" aria-expanded="false" aria-controls="pane-pipeline">Steps</button>
      <button class="btn btn-ghost mobile-pane-button" id="btn-inspector" type="button" aria-expanded="false" aria-controls="pane-inspector">Edit step</button>
      <button class="btn btn-ghost" id="btn-new" type="button" title="Start a new empty workflow">New</button>
      <button class="btn btn-ghost" id="btn-library" type="button" title="Saved workflows">Workflows</button>
      <button class="btn btn-ghost" id="btn-history" type="button" title="Run history">History</button>
      <button class="btn btn-ghost" id="btn-params" type="button" title="Workflow parameters">Params</button>
      <span class="header-sep" aria-hidden="true"></span>
      <button class="btn btn-ghost" id="btn-export" type="button" title="Export as .sluice.json">Export</button>
      <button class="btn btn-ghost" id="btn-import" type="button" title="Import a .sluice.json">Import</button>
      <input type="file" id="import-input" accept=".json" class="hidden">
      <button class="btn btn-icon" id="theme-toggle" type="button" title="Toggle dark mode" aria-label="Toggle dark mode">\u25D1</button>
    </header>
    <div class="app-body">
      <div class="pane pane-pipeline" id="pane-pipeline"></div>
      <div class="resizer" id="resizer-left"></div>
      <div class="pane pane-canvas" id="pane-canvas"></div>
      <div class="resizer" id="resizer-right"></div>
      <div class="pane pane-inspector" id="pane-inspector"></div>
    </div>
    <div class="status-strip" id="status-strip"></div>
  `;

  const panePipeline = root.querySelector('#pane-pipeline');
  const paneCanvas = root.querySelector('#pane-canvas');
  const paneInspector = root.querySelector('#pane-inspector');
  const statusStrip = root.querySelector('#status-strip');
  const wfName = root.querySelector('#wf-name');
  const themeToggle = root.querySelector('#theme-toggle');
  const body = root.querySelector('.app-body');
  const pipelineButton = root.querySelector('#btn-pipeline');
  const inspectorButton = root.querySelector('#btn-inspector');

  function toggleMobilePane(name) {
    const opening = !body.classList.contains(`show-${name}`);
    body.classList.toggle('show-pipeline', name === 'pipeline' && opening);
    body.classList.toggle('show-inspector', name === 'inspector' && opening);
    pipelineButton.setAttribute('aria-expanded', String(body.classList.contains('show-pipeline')));
    inspectorButton.setAttribute('aria-expanded', String(body.classList.contains('show-inspector')));
  }
  pipelineButton.addEventListener('click', () => toggleMobilePane('pipeline'));
  inspectorButton.addEventListener('click', () => toggleMobilePane('inspector'));
  store.subscribe((state, changed) => {
    if (changed.includes('selectedStepId') && state.selectedStepId && matchMedia('(max-width: 820px)').matches) {
      body.classList.remove('show-pipeline');
      body.classList.add('show-inspector');
      pipelineButton.setAttribute('aria-expanded', 'false');
      inspectorButton.setAttribute('aria-expanded', 'true');
    }
  });

  function paintTheme(theme) {
    if (theme === 'dim') document.documentElement.setAttribute('data-theme', 'dim');
    else document.documentElement.removeAttribute('data-theme');
  }

  themeToggle.addEventListener('click', () => {
    const next = store.get().theme === 'dim' ? 'paper' : 'dim';
    store.set({ theme: next });
  });

  wfName.addEventListener('click', async () => {
    const wf = store.get().workflow;
    const name = await promptDialog('Rename workflow', { value: wf.meta.name, confirmText: 'Rename' });
    if (name) store.set({ workflow: { ...wf, meta: { ...wf.meta, name, updated: Date.now() } } });
  });
  root.querySelector('#btn-new').addEventListener('click', async () => {
    if (store.get().workflow.steps.length) {
      const ok = await confirmDialog('Start a new workflow?', { message: 'The current pipeline will be replaced. Save it in Workflows first if you want to keep it.', confirmText: 'Start new' });
      if (!ok) return;
    }
    const wf = createWorkflow('Untitled workflow');
    historyController.resetTo(wf);
    store.set({ workflow: wf, selectedStepId: null });
  });

  root.querySelector('#btn-library').addEventListener('click', () => openLibrary(store, historyController));
  root.querySelector('#btn-history').addEventListener('click', () => openRunHistory(store, engine, historyController));
  root.querySelector('#btn-params').addEventListener('click', () => openParamsEditor(store));
  root.querySelector('#btn-export').addEventListener('click', () => exportWorkflow(store.get().workflow));

  const importInput = root.querySelector('#import-input');
  root.querySelector('#btn-import').addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    importInput.value = '';
    if (!file) return;
    const text = await readFileAsText(file);
    const wf = tryParseWorkflow(text);
    if (wf) {
      historyController.resetTo(wf);
      store.set({ workflow: wf, selectedStepId: null });
    } else {
      alertDialog('Couldn\u2019t import', 'This file is not a valid Sluice workflow.');
    }
  });

  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', async (e) => {
    if (e.target.closest?.('#input-text')) return;
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const text = await readFileAsText(file);
    const wf = tryParseWorkflow(text);
    if (wf) {
      historyController.resetTo(wf);
      store.set({ workflow: wf, selectedStepId: null });
      return;
    }
    const input = document.querySelector('#input-text');
    if (input) input.value = text;
    ingestText(store, engine, text, file.name);
  });

  store.subscribe((state, changed) => {
    if (changed.includes('theme')) paintTheme(state.theme);
    if (changed.includes('workflow')) wfName.textContent = state.workflow.meta.name;
  });
  paintTheme(store.get().theme);
  wfName.textContent = store.get().workflow.meta.name;

  renderStepsPane(panePipeline, store, engine);
  renderCanvasPane(paneCanvas, store, engine);
  renderInspectorPane(paneInspector, store, engine);
  renderStatusStrip(statusStrip, store);

  wireResizer(root.querySelector('#resizer-left'), body, '--pipeline-w', 160, 400, false);
  wireResizer(root.querySelector('#resizer-right'), body, '--inspector-w', 220, 480, true);
}

function wireResizer(handle, container, varName, min, max, fromRight) {
  let dragging = false;

  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    handle.classList.add('active');
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = container.getBoundingClientRect();
    let width = fromRight ? rect.right - e.clientX : e.clientX - rect.left;
    width = Math.max(min, Math.min(max, width));
    container.style.setProperty(varName, `${width}px`);
  });

  window.addEventListener('mouseup', () => {
    dragging = false;
    handle.classList.remove('active');
  });
}
