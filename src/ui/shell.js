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
import { openPalette, isPaletteOpen } from './palette.js';
import { openModal } from './modal.js';
import { MANIFEST } from '../ops/index.js';
import { CATEGORIES } from '../core/catalog.js';
import { toast } from './toast.js';
import { openShareDialog, loadSharedFromHash } from './shareDialog.js';

const MODKEY = /Mac|iPhone|iPad/.test(navigator.platform || '') ? '\u2318' : 'Ctrl';

function openShortcuts() {
  const body = document.createElement('div');
  const rows = [
    ['Action library', `${MODKEY} K`],
    ['Run on full input', `${MODKEY} \u21B5`],
    ['Copy output', `${MODKEY} \u21E7 C`],
    ['Undo / redo pipeline', `${MODKEY} Z / ${MODKEY} \u21E7 Z`],
    ['In library: add step', '\u21B5'],
    ['In library: apply to input now', '\u21E7 \u21B5'],
    ['In library: switch category', 'Alt \u2190 \u2192'],
    ['In library: star favorite', 'Alt S'],
    ['Quick bar: apply to input now', '\u21E7 click'],
    ['Focused step: reorder', 'Alt \u2191 \u2193'],
    ['Focused step: enable / disable', 'E'],
    ['Focused step: delete', 'Del'],
    ['This help', '?']
  ];
  body.innerHTML = `<dl class="shortcut-list">${rows.map(([a, k]) => `<dt>${a}</dt><dd>${k.split(' ').map((x) => (x === '/' ? ' / ' : `<kbd>${x}</kbd>`)).join('')}</dd>`).join('')}</dl>`;
  openModal('Keyboard shortcuts', body, { subtitle: `${MANIFEST.length} actions in ${CATEGORIES.length} categories, all running locally.` });
}

export function mountShell(root, store, engine, historyController) {
  root.innerHTML = `
    <header class="app-header">
      <a class="brand" href="./" aria-label="Sluice home"><img id="brand-logo" src="icons/sluice-light.svg" alt="" width="24" height="24"><span>Sluice</span></a>
      <button id="wf-name" class="wf-name" type="button" title="Rename workflow"></button>
      <span class="header-spacer" aria-hidden="true"></span>
      <button class="btn btn-ghost mobile-pane-button" id="btn-pipeline" type="button" aria-expanded="false" aria-controls="pane-pipeline">Steps</button>
      <button class="btn btn-ghost mobile-pane-button" id="btn-inspector" type="button" aria-expanded="false" aria-controls="pane-inspector">Edit step</button>
      <button class="btn btn-soft" id="btn-library-actions" type="button" title="Browse every action by category (${MODKEY}+K)" aria-haspopup="dialog">\u2630 Actions</button>
      <button class="btn btn-ghost btn-icon" id="btn-undo" type="button" title="Undo (${MODKEY}+Z)" aria-label="Undo">\u21B6</button>
      <button class="btn btn-ghost btn-icon" id="btn-redo" type="button" title="Redo (${MODKEY}+Shift+Z)" aria-label="Redo">\u21B7</button>
      <span class="header-sep" aria-hidden="true"></span>
      <button class="btn btn-ghost" id="btn-new" type="button" title="Start a new empty workflow">New</button>
      <button class="btn btn-ghost" id="btn-library" type="button" title="Saved workflows">Workflows</button>
      <button class="btn btn-ghost" id="btn-history" type="button" title="Run history">History</button>
      <button class="btn btn-ghost" id="btn-params" type="button" title="Workflow parameters">Params</button>
      <span class="header-sep" aria-hidden="true"></span>
      <button class="btn btn-ghost" id="btn-export" type="button" title="Export as .sluice.json">Export</button>
      <button class="btn btn-ghost" id="btn-import" type="button" title="Import a .sluice.json">Import</button>
      <button class="btn btn-ghost" id="btn-share" type="button" title="Copy a link that contains this workflow">Share</button>
      <input type="file" id="import-input" accept=".json" class="hidden" aria-label="Import workflow file">
      <button class="btn btn-ghost btn-icon" id="btn-help" type="button" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">?</button>
      <button class="btn btn-icon" id="theme-toggle" type="button" title="Toggle dark mode" aria-label="Toggle dark mode">\u25D1</button>
    </header>
    <div class="app-body">
      <aside class="pane pane-pipeline" id="pane-pipeline" aria-label="Pipeline steps"></aside>
      <div class="resizer" id="resizer-left" aria-hidden="true"></div>
      <main class="pane pane-canvas" id="pane-canvas" aria-label="Editor"></main>
      <div class="resizer" id="resizer-right" aria-hidden="true"></div>
      <aside class="pane pane-inspector" id="pane-inspector" aria-label="Step settings"></aside>
    </div>
    <footer class="status-strip" id="status-strip"></footer>
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
    const dim = theme === 'dim';
    if (dim) document.documentElement.setAttribute('data-theme', 'dim');
    else document.documentElement.removeAttribute('data-theme');
    const icon = `icons/sluice-${dim ? 'dark' : 'light'}.svg`;
    const logo = root.querySelector('#brand-logo');
    if (logo) logo.src = icon;
    const link = document.querySelector('link[rel="icon"]');
    if (link) link.href = icon;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.content = dim ? '#1d2b2a' : '#f6f3ec'; });
    themeToggle.setAttribute('aria-pressed', String(dim));
    themeToggle.title = dim ? 'Switch to light mode' : 'Switch to dark mode';
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
  root.querySelector('#btn-library-actions').addEventListener('click', () => openPalette(store, engine));
  root.querySelector('#btn-help').addEventListener('click', openShortcuts);
  root.querySelector('#btn-share').addEventListener('click', () => openShareDialog(store));
  window.addEventListener('hashchange', () => loadSharedFromHash(store, engine, historyController));
  requestAnimationFrame(() => loadSharedFromHash(store, engine, historyController));
  const undoBtn = root.querySelector('#btn-undo');
  const redoBtn = root.querySelector('#btn-redo');
  undoBtn.addEventListener('click', () => { historyController.undo(); paintHistory(); });
  redoBtn.addEventListener('click', () => { historyController.redo(); paintHistory(); });
  function paintHistory() {
    undoBtn.disabled = !historyController.canUndo();
    redoBtn.disabled = !historyController.canRedo();
  }
  store.subscribe((state, changed) => { if (changed.includes('workflow')) requestAnimationFrame(paintHistory); });
  paintHistory();

  window.addEventListener('keydown', (e) => {
    const t = e.target;
    const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      if (document.body.classList.contains('modal-open')) return;
      e.preventDefault();
      openPalette(store, engine);
    } else if (e.key === '?' && !typing && !isPaletteOpen() && !document.body.classList.contains('modal-open')) {
      e.preventDefault();
      openShortcuts();
    }
  });
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
      toast(`Imported \u201C${wf.meta.name}\u201D`);
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
    if (input) {
      input.value = text;
      input.dispatchEvent(new Event('input'));
    }
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
