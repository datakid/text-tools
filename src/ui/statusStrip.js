import { MANIFEST } from '../ops/index.js';

export function renderStatusStrip(container, store) {
  const mod = /Mac|iPhone|iPad/.test(navigator.platform || '') ? '\u2318' : 'Ctrl';
  container.innerHTML = '<span id="status-main"></span><span class="status-hint" id="status-hint"></span>';
  const main = container.querySelector('#status-main');
  const hint = container.querySelector('#status-hint');

  function paint() {
    const { stats, lastRunMs, previewMode, previewExact, workflow } = store.get();
    const enabled = workflow.steps.filter((s) => s.enabled).length;
    hint.innerHTML = `${MANIFEST.length} actions \u00b7 runs 100% in your browser \u00b7 <kbd>${mod}</kbd> <kbd>K</kbd> library \u00b7 <kbd>?</kbd> help`;
    if (!stats) {
      main.textContent = 'No input yet \u2014 paste text or press Sample to try it';
      return;
    }
    const mode = previewMode === false ? 'full run' : previewExact ? 'live' : 'sample preview';
    main.textContent = [
      `${stats.docs} doc${stats.docs === 1 ? '' : 's'}`,
      `${stats.lines.toLocaleString()} lines`,
      `${stats.chars.toLocaleString()} chars`,
      `${stats.bytes.toLocaleString()} bytes`,
      `${enabled} step${enabled === 1 ? '' : 's'}`,
      `${lastRunMs ?? 0} ms (${mode})`
    ].join(' \u00b7 ');
  }

  store.subscribe((state, changed) => {
    if (changed.some((k) => ['stats', 'lastRunMs', 'previewMode', 'previewExact', 'workflow'].includes(k))) paint();
  });
  paint();
}
