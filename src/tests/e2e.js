import { createRunner, assert, renderReport } from './harness.js';

const frame = document.getElementById('app-frame');
const root = document.getElementById('report');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(fn, { timeout = 8000, interval = 40, label = 'condition' } = {}) {
  const start = performance.now();
  let last;
  while (performance.now() - start < timeout) {
    try {
      last = await fn();
      if (last) return last;
    } catch {}
    await sleep(interval);
  }
  throw new Error(`timed out waiting for ${label}`);
}

let win;
let doc;
const $ = (sel) => doc.querySelector(sel);
const $$ = (sel) => [...doc.querySelectorAll(sel)];

async function loadApp() {
  frame.src = `index.html?e2e=${Date.now()}`;
  await new Promise((r) => frame.addEventListener('load', r, { once: true }));
  win = frame.contentWindow;
  doc = frame.contentDocument;
  await waitFor(() => doc.documentElement.dataset.ready === 'true' && win.__sluice, { label: 'app boot' });
}

function type(el, value) {
  el.focus();
  el.value = value;
  el.dispatchEvent(new win.Event('input', { bubbles: true }));
}

function key(k, opts = {}, target = doc.activeElement || doc.body) {
  target.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts }));
}

function state() {
  return win.__sluice.store.get();
}

async function outputText() {
  const s = state();
  const k = s.previewMode !== false ? s.previewDocSetKey : s.runDocSetKey;
  if (!k) return null;
  const { text } = await win.__sluice.engine.exportDocs(k, 'clip');
  return text;
}

async function waitOutput(expected, label) {
  return waitFor(async () => (await outputText()) === expected, { label: `${label}: output ${JSON.stringify(expected)} (got ${JSON.stringify(await outputText().catch(() => null))})` });
}

async function reset() {
  const { store, historyController } = win.__sluice;
  const wf = { ...store.get().workflow, steps: [], params: [] };
  historyController.resetTo(wf);
  store.set({ workflow: wf, selectedStepId: null });
  win.__sluiceInputBridge?.set?.('');
  type($('#input-text'), '');
  await sleep(320);
}

const { suite, test, run } = createRunner();

suite('Boot & layout', () => {
  test('app boots with all three panes and quick bar', async () => {
    await loadApp();
    assert.ok($('#pane-pipeline') && $('#pane-canvas') && $('#pane-inspector'), 'panes');
    assert.ok($$('.quick-chip').length >= 10, 'quick chips');
    assert.ok($('#btn-add-step'), 'add step');
    assert.ok($('link[rel="icon"]').getAttribute('href').endsWith('sluice.svg'), 'favicon');
  });
  test('empty pipeline shows recipe shortcuts', () => {
    assert.ok($$('.recipe-chip').length >= 3);
  });
});

suite('Quick tools', () => {
  test('typing input + quick chip produces live output', async () => {
    await reset();
    type($('#input-text'), 'banana\napple\napple');
    $('[data-quick="q-dedupe"]').click();
    await waitOutput('banana\napple', 'dedupe');
    $('[data-quick="q-sort"]').click();
    await waitOutput('apple\nbanana', 'sort');
    assert.eq(state().workflow.steps.length, 2);
  });
  test('output is exact (not sampled) for small input, even for sort', async () => {
    assert.eq(state().previewExact, true);
    assert.match($('#output-title').textContent, /live/);
  });
  test('step cards show a live description', async () => {
    await waitFor(() => $$('.step-desc').some((d) => /Sort natural/.test(d.textContent)), { label: 'sort description' });
  });
  test('Shift+click applies a quick tool to the input directly', async () => {
    await reset();
    type($('#input-text'), 'hello');
    $('[data-quick="q-upper"]').dispatchEvent(new win.MouseEvent('click', { bubbles: true, shiftKey: true }));
    await waitFor(() => $('#input-text').value === 'HELLO', { label: 'input uppercased' });
    assert.eq(state().workflow.steps.length, 0, 'no step added');
  });
  test('undo toast restores applied input', async () => {
    const btn = await waitFor(() => $$('.toast-action').pop(), { label: 'undo toast' });
    btn.click();
    await waitFor(() => $('#input-text').value === 'hello', { label: 'input restored' });
  });
  test('"Use as input" bakes output and clears steps, with undo', async () => {
    await reset();
    type($('#input-text'), 'b\na');
    $('[data-quick="q-sort"]').click();
    await waitOutput('a\nb', 'sort before bake');
    $('#btn-bake').click();
    await waitFor(() => $('#input-text').value === 'a\nb' && state().workflow.steps.length === 0, { label: 'baked' });
    const undo = await waitFor(() => $$('.toast-action').pop(), { label: 'bake undo' });
    undo.click();
    await waitFor(() => $('#input-text').value === 'b\na' && state().workflow.steps.length === 1, { label: 'bake undone' });
  });
});

suite('Action library (palette)', () => {
  test('Ctrl+K opens the library with categories', async () => {
    await reset();
    key('k', { ctrlKey: true }, doc.body);
    await waitFor(() => $('#action-palette'), { label: 'palette' });
    assert.ok($$('.rail-item').length >= 14, 'rail entries');
    assert.ok($$('.palette-item').length > 100, 'all actions listed');
  });
  test('category rail filters the list', async () => {
    $('.rail-item[data-category="Data"]').click();
    await sleep(60);
    const ops = $$('.palette-item').map((el) => el.dataset.op);
    assert.ok(ops.length >= 8 && ops.every((id) => id.startsWith('data.')), ops.join());
  });
  test('Alt+Arrow cycles categories', async () => {
    key('ArrowRight', { altKey: true }, $('#palette-search'));
    await sleep(60);
    assert.eq($('.rail-item.active').dataset.category, 'Code');
  });
  test('search ranks by relevance and shows a live preview', async () => {
    type($('#palette-search'), 'dedupe');
    await sleep(120);
    assert.eq($$('.palette-item')[0].dataset.op, 'lines.dedupe');
    await waitFor(() => $('.detail-after') && $('.detail-after').textContent !== '\u2026', { label: 'detail preview' });
  });
  test('Enter adds the highlighted action as a step', async () => {
    key('Enter', {}, $('#palette-search'));
    await waitFor(() => !$('#action-palette'), { label: 'palette closed' });
    assert.eq(state().workflow.steps.at(-1).op, 'lines.dedupe');
  });
  test('Alt+S stars an action; it appears in Favorites and the quick bar', async () => {
    key('k', { ctrlKey: true }, doc.body);
    await waitFor(() => $('#action-palette'));
    type($('#palette-search'), 'jwt');
    await sleep(120);
    key('s', { altKey: true, code: 'KeyS' }, $('#palette-search'));
    await waitFor(() => $('[data-quick="fav-code.jwtDecode"]'), { label: 'fav chip' });
    type($('#palette-search'), '');
    await sleep(60);
    $('.rail-item[data-category="favorites"]').click();
    await sleep(60);
    assert.eq($$('.palette-item').map((e) => e.dataset.op), ['code.jwtDecode']);
  });
  test('Recent shows previously added actions', async () => {
    $('.rail-item[data-category="recent"]').click();
    await sleep(60);
    assert.ok($$('.palette-item').some((e) => e.dataset.op === 'lines.dedupe'));
  });
  test('Shift+Enter applies an action to the input', async () => {
    key('Escape', {}, $('#palette-search'));
    await waitFor(() => !$('#action-palette'));
    await reset();
    type($('#input-text'), 'a, b, c');
    key('k', { ctrlKey: true }, doc.body);
    await waitFor(() => $('#action-palette'));
    type($('#palette-search'), 'split items onto lines');
    await sleep(120);
    key('Enter', { shiftKey: true }, $('#palette-search'));
    await waitFor(() => $('#input-text').value === 'a\nb\nc', { label: 'applied split' });
  });
  test('Escape clears search first, then closes', async () => {
    key('k', { ctrlKey: true }, doc.body);
    await waitFor(() => $('#action-palette'));
    type($('#palette-search'), 'zzz-nothing');
    await sleep(80);
    assert.ok($('.palette-empty'), 'empty state');
    key('Escape', {}, $('#palette-search'));
    await sleep(40);
    assert.eq($('#palette-search').value, '');
    key('Escape', {}, $('#palette-search'));
    await waitFor(() => !$('#action-palette'), { label: 'closed' });
  });
  test('recipe loads multiple steps and sample text', async () => {
    await reset();
    key('k', { ctrlKey: true }, doc.body);
    await waitFor(() => $('#action-palette'));
    $('.rail-item[data-category="recipes"]').click();
    await sleep(60);
    $('[data-recipe="r-clean-list"]').click();
    await waitFor(() => state().workflow.steps.length === 4, { label: 'recipe steps' });
    await waitOutput('apple\nbanana\ncherry\nfile2\nfile10', 'recipe output');
  });
});

suite('Inspector & editing', () => {
  test('selecting a step shows its settings and examples', async () => {
    await reset();
    type($('#input-text'), 'foo bar foo');
    key('k', { ctrlKey: true }, doc.body);
    await waitFor(() => $('#action-palette'));
    type($('#palette-search'), 'find & replace');
    await sleep(120);
    key('Enter', {}, $('#palette-search'));
    await waitFor(() => $('#f-find'), { label: 'inspector form' });
    assert.ok($$('.example-card').length >= 1, 'examples');
  });
  test('editing a field updates output live', async () => {
    type($('#f-find'), 'foo');
    type($('#f-replaceWith'), 'baz');
    await waitOutput('baz bar baz', 'replace');
  });
  test('\\n escapes in single-line fields become real newlines', async () => {
    type($('#f-replaceWith'), '\\n');
    await waitOutput('\n bar \n', 'newline replace');
  });
  test('Reset settings restores defaults', async () => {
    $('#btn-reset-step').click();
    await waitOutput('foo bar foo', 'reset');
  });
  test('Undo / redo via header buttons', async () => {
    const before = state().workflow.steps.length;
    $('[data-quick="q-upper"]').click();
    await waitFor(() => state().workflow.steps.length === before + 1);
    $('#btn-undo').click();
    await waitFor(() => state().workflow.steps.length === before, { label: 'undo' });
    $('#btn-redo').click();
    await waitFor(() => state().workflow.steps.length === before + 1, { label: 'redo' });
  });
  test('disable step with E key and delete with Del + undo toast', async () => {
    const card = $$('.step-card').pop();
    card.focus();
    key('e', {}, card);
    await waitFor(() => state().workflow.steps.at(-1).enabled === false, { label: 'disabled' });
    const card2 = $$('.step-card').pop();
    card2.focus();
    const n = state().workflow.steps.length;
    key('Delete', {}, card2);
    await waitFor(() => state().workflow.steps.length === n - 1, { label: 'deleted' });
    (await waitFor(() => $$('.toast-action').pop())).click();
    await waitFor(() => state().workflow.steps.length === n, { label: 'delete undone' });
  });
  test('Clear removes every step', async () => {
    $('#btn-clear-steps').click();
    await waitFor(() => state().workflow.steps.length === 0);
  });
});

suite('Run, views & errors', () => {
  test('Ctrl+Enter runs the full input', async () => {
    await reset();
    type($('#input-text'), 'x\ny');
    $('[data-quick="q-upper"]').click();
    await waitOutput('X\nY', 'preview');
    key('Enter', { ctrlKey: true }, doc.body);
    await waitFor(() => state().previewMode === false, { label: 'full run' });
    assert.match($('#output-title').textContent, /full run/);
  });
  test('Diff view shows additions and removals', async () => {
    $('.doc-tab[data-view="diff"]').click();
    await waitFor(() => $('.diff-summary') && /\+2/.test($('.diff-summary').textContent), { label: 'diff summary' });
    $('.doc-tab[data-view="docs"]').click();
  });
  test('Stats view lists totals', async () => {
    $('.doc-tab[data-view="stats"]').click();
    await waitFor(() => $('.stats-table'), { label: 'stats' });
    $('.doc-tab[data-view="docs"]').click();
  });
  test('Find view highlights matches', async () => {
    $('.doc-tab[data-view="matches"]').click();
    type($('#match-input'), 'X');
    await waitFor(() => /1 match/.test($('#match-count').textContent), { label: 'match count' });
    $('.doc-tab[data-view="docs"]').click();
  });
  test('failing step is flagged on its card and in the banner', async () => {
    await reset();
    type($('#input-text'), 'a');
    const { store } = win.__sluice;
    const wf = store.get().workflow;
    store.set({ workflow: { ...wf, steps: [{ id: 's_assert', op: 'flow.assert', params: { mode: 'docCount', expectedCount: 5 }, enabled: true, note: '' }] } });
    key('Enter', { ctrlKey: true }, doc.body);
    await waitFor(() => $('.step-card.has-error'), { label: 'error card' });
    assert.match($('#run-banner').textContent, /Expected 5 docs/);
  });
  test('split step produces document tabs', async () => {
    await reset();
    type($('#input-text'), 'a\n\nb\n\nc');
    key('k', { ctrlKey: true }, doc.body);
    await waitFor(() => $('#action-palette'));
    type($('#palette-search'), 'split by blank line');
    await sleep(120);
    key('Enter', {}, $('#palette-search'));
    await waitFor(() => $$('#doc-tabs .doc-tab').length === 3, { label: 'doc tabs' });
  });
});

suite('Persistence & safety', () => {
  test('saved workflow can be reopened from the library', async () => {
    const { store } = win.__sluice;
    const persist = await import('../core/persist.js');
    assert.ok(persist, 'module loads');
    $('#btn-library').click();
    await waitFor(() => $('#lib-save-current'), { label: 'library' });
    $('#lib-save-current').click();
    const input = await waitFor(() => $('#prompt-input'), { label: 'prompt' });
    input.value = 'E2E saved';
    input.form.dispatchEvent(new win.Event('submit', { cancelable: true }));
    await waitFor(() => $$('.list-title').some((t) => t.textContent === 'E2E saved'), { label: 'saved row' });
    assert.eq(store.get().workflow.meta.name, 'E2E saved');
    key('Escape', {}, doc.body);
    await sleep(250);
  });
  test('invalid workflow import is rejected with a dialog', async () => {
    const inputEl = $('#import-input');
    const dt = new win.DataTransfer();
    dt.items.add(new win.File(['{"kind":"nope"}'], 'bad.sluice.json', { type: 'application/json' }));
    inputEl.files = dt.files;
    inputEl.dispatchEvent(new win.Event('change'));
    await waitFor(() => $$('.modal-dialog h3').some((h) => /Couldn/.test(h.textContent)), { label: 'error dialog' });
    key('Escape', {}, doc.body);
    await sleep(250);
  });
  test('? opens keyboard shortcuts', async () => {
    doc.body.focus();
    key('?', {}, doc.body);
    await waitFor(() => $('.shortcut-list'), { label: 'shortcuts' });
    key('Escape', {}, doc.body);
    await sleep(250);
  });
  test('e2e mode never touched real localStorage', () => {
    const real = JSON.parse(localStorage.getItem('sluice.favorites') || '[]');
    assert.ok(!real.includes('code.jwtDecode') || window.__hadJwtFav, 'real favorites untouched');
  });
  test('theme toggle switches data-theme', async () => {
    const before = doc.documentElement.getAttribute('data-theme');
    $('#theme-toggle').click();
    await sleep(30);
    assert.ok(doc.documentElement.getAttribute('data-theme') !== before);
    $('#theme-toggle').click();
  });
});

window.__hadJwtFav = JSON.parse(localStorage.getItem('sluice.favorites') || '[]').includes('code.jwtDecode');

const report = await run(({ pass, fail, test: t }) => {
  document.title = `E2E \u00b7 ${pass} \u2713 ${fail} \u2717 \u00b7 ${t}`;
});
renderReport(root, report, 'Sluice end-to-end UI tests');
document.title = `Sluice E2E \u00b7 ${report.pass} passed \u00b7 ${report.fail} failed`;
document.documentElement.dataset.done = 'true';
console.log(`Sluice E2E: ${report.pass} passed, ${report.fail} failed in ${report.ms} ms`);
for (const s of report.results) for (const t of s.tests) if (!t.ok) console.error(`FAIL ${s.name} \u203a ${t.name}: ${t.error}`);
