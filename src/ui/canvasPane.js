import { runWithParamsIfNeeded } from './paramsDialog.js';
import { ingestText } from './ingest.js';
import { createVirtualText } from './virtualText.js';
import { renderDocTabs } from './docTabs.js';
import { renderStatsTable } from './statsView.js';
import { toast } from './toast.js';
import { QUICK_ACTIONS, categoryOf } from '../core/catalog.js';
import { MANIFEST } from '../ops/index.js';
import { getFavorites, onPrefsChange } from '../core/prefs.js';
import { readLocal, writeLocal } from '../core/env.js';
import { addStep, bakeOutput, fullOutputText, registerInput } from './actions.js';
import { previewOp, openPalette } from './palette.js';
import { escapeHtml } from './escape.js';

const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = IS_MAC ? '\u2318' : 'Ctrl';

const SAMPLE_TEXT = `Shopping list — exported 2026-10-08
  bananas
apples
Apples

  file10.txt
file2.txt
Contact: ada@example.com, grace@navy.mil
Docs: https://example.com/guide?page=2
“Smart quotes” — and trailing spaces   
`;

export function renderCanvasPane(container, store, engine) {
  container.innerHTML = `
    <div class="canvas-toolbar">
      <button class="btn btn-primary" id="btn-run" type="button" title="Run on the full input (${MOD}+Enter)">\u25B6 Run <kbd class="kbd-inline">${MOD}\u23CE</kbd></button>
      <button class="btn" id="btn-bake" type="button" title="Replace the input with the output and clear the steps \u2014 chain quick edits">\u21E4 Use as input</button>
      <span class="mono run-banner" id="run-banner" role="status" aria-live="polite"></span>
      <span class="toolbar-spacer"></span>
      <button class="btn btn-ghost" id="btn-copy-output" type="button" title="Copy full output (${MOD}+Shift+C)" disabled>Copy</button>
      <button class="btn btn-ghost" id="btn-download-output" type="button" title="Download full output as .txt" disabled>Download</button>
    </div>
    <nav class="quick-bar" id="quick-bar" aria-label="Quick actions"></nav>
    <div class="doc-tabs" id="doc-tabs"></div>
    <div class="canvas-split">
      <div class="canvas-col">
        <div class="canvas-col-title"><span>Input <span class="col-meta mono" id="input-meta"></span></span><span class="col-actions"><button class="btn btn-ghost btn-xs" id="btn-paste" type="button">Paste</button><button class="btn btn-ghost btn-xs" id="btn-sample" type="button">Sample</button><button class="btn btn-ghost btn-xs" id="btn-open-file" type="button">Open file</button><button class="btn btn-ghost btn-xs" id="btn-clear-input" type="button">Clear</button></span></div>
        <input type="file" id="input-file" class="hidden" accept=".txt,.md,.csv,.tsv,.json,.jsonl,.log,.xml,.html,.yml,.yaml,.ini,.env,.sql,text/*">
        <textarea class="canvas-text" id="input-text" aria-label="Input text" spellcheck="false" placeholder="Paste text, type, or drop a file here\u2026\n\nThen click a quick action above, or press ${MOD}+K to browse every tool by category."></textarea>
      </div>
      <div class="canvas-col">
        <div class="canvas-col-title"><span id="output-title">Output</span><span class="col-meta mono" id="output-meta"></span></div>
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
  const quickBar = container.querySelector('#quick-bar');
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
  const bakeBtn = container.querySelector('#btn-bake');
  const outputTitle = container.querySelector('#output-title');
  const outputMeta = container.querySelector('#output-meta');
  const inputMeta = container.querySelector('#input-meta');
  const outputEmpty = container.querySelector('#output-empty');
  const copyBtn = container.querySelector('#btn-copy-output');
  const downloadBtn = container.querySelector('#btn-download-output');
  const fileInput = container.querySelector('#input-file');

  let ingestTimer = null;
  let inputDirty = false;

  function setInput(text, name) {
    inputText.value = text;
    inputDirty = false;
    clearTimeout(ingestTimer);
    saveDraft(text);
    paintInputMeta();
    return ingestText(store, engine, text, name);
  }

  registerInput({ get: () => inputText.value, set: (text) => setInput(text), focus: () => inputText.focus() });

  function paintInputMeta() {
    const v = inputText.value;
    if (!v) {
      inputMeta.textContent = '';
      return;
    }
    const lines = v.split(/\r\n|\r|\n/).length;
    inputMeta.textContent = `${lines.toLocaleString()} ln \u00b7 ${v.length.toLocaleString()} ch`;
  }

  function paintQuickBar() {
    quickBar.innerHTML = '';
    const favs = getFavorites();
    const chips = [
      ...favs.map((id) => ({ id: `fav-${id}`, op: id, label: MANIFEST.find((m) => m.id === id)?.name || id, params: {}, fav: true })),
      ...QUICK_ACTIONS.filter((q) => !favs.includes(q.op) || Object.keys(q.params).length)
    ];
    for (const q of chips) {
      const entry = MANIFEST.find((m) => m.id === q.op);
      if (!entry) continue;
      const cat = categoryOf(entry.group);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `quick-chip${q.fav ? ' is-fav' : ''}`;
      b.dataset.quick = q.id;
      b.style.setProperty('--hue', cat.hue);
      b.title = `${entry.name} \u2014 click to add as a step \u00b7 Shift+click to apply to the input right away`;
      b.innerHTML = `${q.fav ? '<span aria-hidden="true">\u2605</span>' : ''}${escapeHtml(q.label)}`;
      b.addEventListener('click', async (e) => {
        if (e.shiftKey || e.altKey) {
          const text = inputText.value;
          if (!text) return toast('Paste some input first', 'error');
          try {
            const { docs } = await previewOp(q.op, text, q.params);
            const before = text;
            setInput(docs.map((d) => d.text).join('\n\n'));
            toast(`Applied \u201C${entry.name}\u201D to input`, 'ok', { action: 'Undo', onAction: () => setInput(before) });
          } catch (err) {
            toast(err.message, 'error');
          }
          return;
        }
        await addStep(store, engine, q.op, q.params, { select: false });
      });
      quickBar.appendChild(b);
    }
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'quick-chip quick-more';
    more.id = 'btn-quick-more';
    more.innerHTML = `All tools <kbd class="kbd-inline">${MOD}K</kbd>`;
    more.addEventListener('click', () => openPalette(store, engine));
    quickBar.appendChild(more);
  }
  onPrefsChange(paintQuickBar);
  paintQuickBar();

  container.querySelector('#btn-open-file').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    setInput(await file.text(), file.name);
  });
  container.querySelector('#btn-clear-input').addEventListener('click', () => {
    const before = inputText.value;
    setInput('');
    inputText.focus();
    if (before) toast('Input cleared', 'ok', { action: 'Undo', onAction: () => setInput(before) });
  });
  container.querySelector('#btn-sample').addEventListener('click', () => {
    const before = inputText.value;
    setInput(SAMPLE_TEXT);
    if (before) toast('Loaded sample text', 'ok', { action: 'Undo', onAction: () => setInput(before) });
  });
  container.querySelector('#btn-paste').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return toast('Clipboard is empty', 'error');
      setInput(text);
      toast(`Pasted ${text.length.toLocaleString()} characters`);
    } catch {
      inputText.focus();
      inputText.select();
      toast(`Clipboard blocked \u2014 press ${MOD}+V to paste`, 'error');
    }
  });

  let draftTimer = null;
  function saveDraft(text) {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      writeLocal('sluice.draft', text.length <= 1_000_000 ? text : null);
    }, 400);
  }

  async function copyOutput() {
    try {
      const text = await fullOutputText(store, engine);
      if (text == null) return;
      await navigator.clipboard.writeText(text);
      toast(`Copied ${text.length.toLocaleString()} characters`);
    } catch (e) {
      toast(`Copy failed: ${e.message}`, 'error');
    }
  }
  copyBtn.addEventListener('click', copyOutput);

  downloadBtn.addEventListener('click', async () => {
    try {
      const text = await fullOutputText(store, engine);
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

  bakeBtn.addEventListener('click', async () => {
    try {
      await bakeOutput(store, engine);
    } catch (e) {
      toast(e.message, 'error');
    }
  });

  const vtext = createVirtualText(vtextContainer);

  let viewTab = 'docs';
  let matchTimer = null;

  inputText.addEventListener('input', () => {
    inputDirty = true;
    saveDraft(inputText.value);
    paintInputMeta();
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
    setInput(await file.text(), file.name);
  });

  runBtn.addEventListener('click', runCurrentInput);
  window.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('modal-open') || document.body.classList.contains('palette-open')) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'Enter') {
      e.preventDefault();
      runCurrentInput();
    } else if (mod && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      copyOutput();
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
    renderDocTabs(docTabsEl, docsMeta.length > 1 ? docsMeta : [], activeDocIndex, (i) => store.set({ activeDocIndex: i }));
  }

  function paintViewTabs() {
    viewTabsEl.innerHTML = '';
    ['docs', 'diff', 'matches', 'stats'].forEach((t) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.dataset.view = t;
      tab.setAttribute('aria-current', t === viewTab ? 'true' : 'false');
      tab.className = `doc-tab${t === viewTab ? ' active' : ''}`;
      tab.textContent = { docs: 'Text', diff: 'Diff', matches: 'Find', stats: 'Stats' }[t];
      tab.addEventListener('click', () => {
        viewTab = t;
        paintViewTabs();
        paintView();
        if (t === 'matches') matchInput.focus();
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
    const escaped = matchMode.value === 'regex' ? pattern : pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      const job = engine.matches(key, escaped, '', 5000);
      const result = await job.promise;
      const idx = state.activeDocIndex || 0;
      const inDoc = result.hits.filter((h) => h.doc === idx);
      matchCount.textContent = `${result.hits.length} match${result.hits.length === 1 ? '' : 'es'}`;
      vtext.setHighlights(inDoc);
      paintMinimap(inDoc, state.docsMeta?.[idx]?.lines || 0);
      if (inDoc[0]) vtext.scrollToLine(inDoc[0].line);
    } catch (e) {
      matchCount.textContent = e.message;
    }
  }

  async function renderDocsOrMatches(key, idx) {
    showOnly(vtextWrap);
    try {
      const first = await engine.window(key, idx, 0, 1);
      if (key !== currentKey() || idx !== Math.min(store.get().activeDocIndex || 0, (store.get().docsMeta || []).length - 1)) return;
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
      const adds = ops.filter((o) => o.type === 'add').length;
      const removes = ops.filter((o) => o.type === 'remove').length;
      const summary = document.createElement('div');
      summary.className = 'diff-summary';
      summary.innerHTML = adds || removes ? `<span class="delta-add">+${adds}</span> <span class="delta-remove">\u2212${removes}</span> lines changed` : 'No changes';
      diffView.appendChild(summary);
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

  function paintOutputMeta() {
    const { stats, inputStats } = store.get();
    if (!stats) {
      outputMeta.textContent = '';
      return;
    }
    const delta = inputStats ? stats.lines - inputStats.lines : 0;
    outputMeta.innerHTML = `${stats.docs > 1 ? `${stats.docs} docs \u00b7 ` : ''}${stats.lines.toLocaleString()} ln${delta ? ` <span class="${delta > 0 ? 'delta-up' : 'delta-down'}">(${delta > 0 ? '+' : ''}${delta.toLocaleString()})</span>` : ''} \u00b7 ${stats.chars.toLocaleString()} ch`;
  }

  async function paintView() {
    matchToolbar.classList.toggle('hidden', viewTab !== 'matches');
    const state = store.get();
    const key = currentKey();
    const docsMeta = state.docsMeta || [];
    const live = state.previewMode !== false;
    outputTitle.innerHTML = live
      ? state.previewExact
        ? 'Output <span class="mode-pill mode-pill-live" title="The whole input is processed as you type">live</span>'
        : 'Output <span class="mode-pill" title="Large input: only the first 256 KB is previewed. Press Run for the full result.">sample preview</span>'
      : 'Output <span class="mode-pill mode-pill-run">full run</span>';
    paintOutputMeta();
    const hasOutput = Boolean(key && docsMeta.length);
    copyBtn.disabled = !state.docSetKey;
    downloadBtn.disabled = !state.docSetKey;
    bakeBtn.disabled = !state.docSetKey || !state.workflow.steps.some((s) => s.enabled);

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
      const err = (state.errors || []).find((e) => !e.hint) || (state.errors || [])[0];
      runBanner.textContent = err ? (err.hint ? `${err.message} \u2014 ${err.hint}` : err.message) : '';
      runBanner.classList.toggle('is-error', Boolean(err && !err.hint));
      runBanner.classList.toggle('is-note', Boolean(err && err.hint));
    }
    if (changed.includes('busy')) container.classList.toggle('is-busy', Boolean(state.busy));
    if (changed.includes('workflow')) bakeBtn.disabled = !state.docSetKey || !state.workflow.steps.some((s) => s.enabled);
    if (
      changed.includes('docsMeta') ||
      changed.includes('activeDocIndex') ||
      changed.includes('previewDocSetKey') ||
      changed.includes('runDocSetKey') ||
      changed.includes('previewMode')
    ) {
      paintDocTabs();
      paintView();
    }
  });

  paintViewTabs();
  paintDocTabs();
  paintView();

  const draft = readLocal('sluice.draft', '');
  if (draft) setInput(draft);
}
