import { runWithParamsIfNeeded } from './paramsDialog.js';
import { ingestText } from './ingest.js';
import { createVirtualText } from './virtualText.js';
import { renderDocTabs } from './docTabs.js';
import { renderStatsTable } from './statsView.js';
import { toast } from './toast.js';

const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = IS_MAC ? '\u2318' : 'Ctrl';

export function renderCanvasPane(container, store, engine) {
  container.innerHTML = `
    <div class="canvas-toolbar">
      <button class="btn btn-primary" id="btn-run" type="button" title="Run on the full input (${MOD}+Enter)">\u25B6 Run <kbd class="kbd-inline">${MOD}\u23CE</kbd></button>
      <span class="mono run-banner" id="run-banner" role="status" aria-live="polite"></span>
      <span class="toolbar-spacer"></span>
      <button class="btn btn-ghost" id="btn-copy-output" type="button" title="Copy full output" disabled>Copy</button>
      <button class="btn btn-ghost" id="btn-download-output" type="button" title="Download full output as .txt" disabled>Download</button>
    </div>
    <div class="doc-tabs" id="doc-tabs"></div>
    <div class="canvas-split">
      <div class="canvas-col">
        <div class="canvas-col-title"><span>Input</span><span class="col-actions"><button class="btn btn-ghost btn-xs" id="btn-open-file" type="button">Open file</button><button class="btn btn-ghost btn-xs" id="btn-clear-input" type="button">Clear</button></span></div>
        <input type="file" id="input-file" class="hidden" accept=".txt,.md,.csv,.tsv,.json,.log,.xml,.html,.yml,.yaml,text/*">
        <textarea class="canvas-text" id="input-text" aria-label="Input text" spellcheck="false" placeholder="Paste text, type, or drop a file here to begin\u2026"></textarea>
      </div>
      <div class="canvas-col">
        <div class="canvas-col-title"><span id="output-title">Output</span></div>
        <div class="view-tabs" id="view-tabs"></div>
        <div class="match-toolbar hidden" id="match-toolbar">
          <input type="text" id="match-input" aria-label="Find in output" placeholder="Find in output\u2026">
          <select id="match-mode" aria-label="Search mode">
            <option value="literal">Literal</option>
            <option value="regex">Regex</option>
          </select>
          <span class="match-count" id="match-count"></span>
        </div>
        <div class="view-body" id="view-body">
          <div class="vtext-wrap hidden" id="vtext-wrap">
            <div id="vtext-container" style="flex:1;display:flex;min-width:0"></div>
            <div class="minimap" id="minimap"></div>
          </div>
          <div class="diff-view hidden" id="diff-view"></div>
          <div class="stats-view hidden" id="stats-view"></div>
          <div class="output-empty" id="output-empty"><strong>Nothing to show yet</strong><span>Your transformed text appears here as you type.</span></div>
        </div>
      </div>
    </div>
  `;

  const inputText = container.querySelector('#input-text');
  const docTabsEl = container.querySelector('#doc-tabs');
  const viewTabsEl = container.querySelector('#view-tabs');
  const matchToolbar = container.querySelector('#match-toolbar');
  const matchInput = container.querySelector('#match-input');
  const matchMode = container.querySelector('#match-mode');
  const matchCount = container.querySelector('#match-count');
  const vtextWrap = container.querySelector('#vtext-wrap');
  const vtextContainer = container.querySelector('#vtext-container');
  const minimapEl = container.querySelector('#minimap');
  const diffView = container.querySelector('#diff-view');
  const statsView = container.querySelector('#stats-view');
  const runBanner = container.querySelector('#run-banner');
  const runBtn = container.querySelector('#btn-run');
  const outputTitle = container.querySelector('#output-title');
  const outputEmpty = container.querySelector('#output-empty');
  const copyBtn = container.querySelector('#btn-copy-output');
  const downloadBtn = container.querySelector('#btn-download-output');
  const fileInput = container.querySelector('#input-file');

  container.querySelector('#btn-open-file').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    const text = await file.text();
    inputText.value = text;
    saveDraft(text);
    ingestText(store, engine, text, file.name);
  });
  container.querySelector('#btn-clear-input').addEventListener('click', () => {
    inputText.value = '';
    saveDraft('');
    ingestText(store, engine, '');
    inputText.focus();
  });

  let draftTimer = null;
  function saveDraft(text) {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      try {
        if (text.length <= 1_000_000) localStorage.setItem('sluice.draft', text);
        else localStorage.removeItem('sluice.draft');
      } catch {}
    }, 400);
  }

  async function fullOutputText() {
    const state = store.get();
    if (!state.docSetKey) return null;
    let key = state.previewMode === false ? state.runDocSetKey : null;
    if (!key) {
      const job = engine.run(state.docSetKey, state.workflow.steps, state.workflow.params, {});
      const result = await job.promise;
      if (result.errors?.length) throw new Error(result.errors[0].message);
      key = result.docSetKey;
    }
    const { text } = await engine.exportDocs(key, 'clip');
    return text;
  }

  copyBtn.addEventListener('click', async () => {
    try {
      const text = await fullOutputText();
      if (text == null) return;
      await navigator.clipboard.writeText(text);
      toast(`Copied ${text.length.toLocaleString()} characters`);
    } catch (e) {
      toast(`Copy failed: ${e.message}`, 'error');
    }
  });

  downloadBtn.addEventListener('click', async () => {
    try {
      const text = await fullOutputText();
      if (text == null) return;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const base = (store.get().workflow.meta.name || 'output').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'output';
      a.download = `${base}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Download started');
    } catch (e) {
      toast(`Download failed: ${e.message}`, 'error');
    }
  });

  const vtext = createVirtualText(vtextContainer);

  let viewTab = 'docs';
  let matchTimer = null;

  let ingestTimer = null;
  let inputDirty = false;
  inputText.addEventListener('input', () => {
    inputDirty = true;
    saveDraft(inputText.value);
    clearTimeout(ingestTimer);
    ingestTimer = setTimeout(() => {
      inputDirty = false;
      ingestText(store, engine, inputText.value);
    }, 200);
  });

  async function runCurrentInput() {
    if (inputDirty || !store.get().docSetKey) {
      clearTimeout(ingestTimer);
      inputDirty = false;
      await ingestText(store, engine, inputText.value);
    }
    runWithParamsIfNeeded(store, engine);
  }

  inputText.addEventListener('dragover', (e) => e.preventDefault());
  inputText.addEventListener('drop', async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const text = await file.text();
    inputText.value = text;
    saveDraft(text);
    ingestText(store, engine, text, file.name);
  });

  runBtn.addEventListener('click', runCurrentInput);
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !document.body.classList.contains('modal-open')) {
      e.preventDefault();
      runCurrentInput();
    }
  });

  matchInput.addEventListener('input', () => {
    clearTimeout(matchTimer);
    matchTimer = setTimeout(runSearch, 150);
  });
  matchMode.addEventListener('change', runSearch);

  function currentKey() {
    const state = store.get();
    return state.previewMode !== false ? state.previewDocSetKey : state.runDocSetKey;
  }

  function paintDocTabs() {
    const { docsMeta = [], activeDocIndex = 0 } = store.get();
    renderDocTabs(docTabsEl, docsMeta, activeDocIndex, (i) => store.set({ activeDocIndex: i }));
  }

  function paintViewTabs() {
    viewTabsEl.innerHTML = '';
    ['docs', 'diff', 'matches', 'stats'].forEach((t) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.setAttribute('aria-current', t === viewTab ? 'true' : 'false');
      tab.className = `doc-tab${t === viewTab ? ' active' : ''}`;
      tab.textContent = { docs: 'Text', diff: 'Diff', matches: 'Find', stats: 'Stats' }[t];
      tab.addEventListener('click', () => {
        viewTab = t;
        paintViewTabs();
        paintView();
      });
      viewTabsEl.appendChild(tab);
    });
  }

  function showOnly(el) {
    [vtextWrap, diffView, statsView, outputEmpty].forEach((n) => n.classList.toggle('hidden', n !== el));
  }

  function paintMinimap(hits, totalLines) {
    minimapEl.innerHTML = '';
    if (!totalLines) return;
    for (const hit of hits) {
      const tick = document.createElement('div');
      tick.className = 'minimap-tick';
      tick.style.top = `${(hit.line / totalLines) * 100}%`;
      minimapEl.appendChild(tick);
    }
  }

  minimapEl.addEventListener('click', (e) => {
    const rect = minimapEl.getBoundingClientRect();
    const fraction = (e.clientY - rect.top) / rect.height;
    const { docsMeta = [], activeDocIndex = 0 } = store.get();
    const total = docsMeta[activeDocIndex]?.lines || 0;
    vtext.scrollToLine(Math.round(fraction * total));
  });

  async function runSearch() {
    if (viewTab !== 'matches') return;
    const state = store.get();
    const key = currentKey();
    const pattern = matchInput.value;
    if (!key || !pattern) {
      matchCount.textContent = '';
      vtext.setHighlights([]);
      paintMinimap([], 0);
      return;
    }
    const flags = matchMode.value === 'regex' ? '' : undefined;
    const escaped = matchMode.value === 'regex' ? pattern : pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      const job = engine.matches(key, escaped, flags, 5000);
      const result = await job.promise;
      const idx = state.activeDocIndex || 0;
      const inDoc = result.hits.filter((h) => h.doc === idx);
      matchCount.textContent = `${result.hits.length} match${result.hits.length === 1 ? '' : 'es'}`;
      vtext.setHighlights(inDoc);
      paintMinimap(inDoc, state.docsMeta?.[idx]?.lines || 0);
    } catch (e) {
      matchCount.textContent = e.message;
    }
  }

  async function renderDocsOrMatches(key, idx) {
    showOnly(vtextWrap);
    try {
      const first = await engine.window(key, idx, 0, 1);
      if (key !== currentKey() || idx !== store.get().activeDocIndex) return;
      vtext.setSource(first.totalLines, (from, to) => engine.window(key, idx, from, to).then((r) => r.lines));
    } catch (error) {
      runBanner.textContent = error.message;
      return;
    }
    if (viewTab === 'matches') {
      runSearch();
    } else {
      vtext.setHighlights([]);
      paintMinimap([], 0);
    }
  }

  async function renderDiff(inputKey, outputKey, idx) {
    showOnly(diffView);
    diffView.innerHTML = 'Computing diff\u2026';
    try {
      const job = engine.diff(inputKey, 0, outputKey, idx);
      const { ops } = await job.promise;
      diffView.innerHTML = '';
      const frag = document.createDocumentFragment();
      for (const op of ops) {
        const row = document.createElement('div');
        row.className = `diff-line${op.type === 'add' ? ' diff-add' : op.type === 'remove' ? ' diff-remove' : ''}`;
        const gutter = document.createElement('span');
        gutter.className = 'diff-gutter';
        gutter.textContent = op.type === 'add' ? '+' : op.type === 'remove' ? '\u2212' : '';
        const text = document.createElement('span');
        text.className = 'diff-text';
        text.textContent = op.line;
        row.appendChild(gutter);
        row.appendChild(text);
        frag.appendChild(row);
      }
      diffView.appendChild(frag);
    } catch (e) {
      diffView.textContent = e.message;
    }
  }

  function renderStats(docsMeta) {
    showOnly(statsView);
    renderStatsTable(statsView, docsMeta);
  }

  async function paintView() {
    matchToolbar.classList.toggle('hidden', viewTab !== 'matches');
    const state = store.get();
    const key = currentKey();
    const docsMeta = state.docsMeta || [];
    outputTitle.innerHTML = state.previewMode !== false ? 'Output <span class="mode-pill">live preview</span>' : 'Output <span class="mode-pill mode-pill-run">full run</span>';
    const hasOutput = Boolean(key && docsMeta.length);
    copyBtn.disabled = !state.docSetKey;
    downloadBtn.disabled = !state.docSetKey;

    if (!hasOutput) {
      vtext.setSource(0, null);
      showOnly(outputEmpty);
      return;
    }

    const idx = Math.min(state.activeDocIndex || 0, docsMeta.length - 1);

    if (viewTab === 'diff') {
      await renderDiff(state.docSetKey, key, idx);
    } else if (viewTab === 'stats') {
      renderStats(docsMeta);
    } else {
      await renderDocsOrMatches(key, idx);
    }
  }

  store.subscribe((state, changed) => {
    if (changed.includes('errors')) {
      const err = (state.errors || [])[0];
      runBanner.textContent = err ? (err.hint ? `${err.message} \u2014 ${err.hint}` : err.message) : '';
      runBanner.style.color = err ? 'var(--c-madder)' : 'var(--c-ink-2)';
    }
    if (
      changed.includes('docsMeta') ||
      changed.includes('activeDocIndex') ||
      changed.includes('previewDocSetKey') ||
      changed.includes('runDocSetKey')
    ) {
      paintDocTabs();
      paintView();
    }
  });

  paintViewTabs();
  paintDocTabs();
  paintView();

  try {
    const draft = localStorage.getItem('sluice.draft');
    if (draft) {
      inputText.value = draft;
      ingestText(store, engine, draft);
    }
  } catch {}
}
