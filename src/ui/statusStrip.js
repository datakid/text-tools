export function renderStatusStrip(container, store) {
  function paint() {
    const { stats, lastRunMs, previewMode } = store.get();
    if (!stats) {
      container.textContent = 'No input yet';
      return;
    }
    const mode = previewMode !== false ? 'preview' : 'run';
    container.textContent = [
      `${stats.docs} docs`,
      `${stats.lines.toLocaleString()} lines`,
      `${stats.chars.toLocaleString()} chars`,
      `${stats.bytes.toLocaleString()} bytes`,
      `ran in ${lastRunMs ?? 0} ms (${mode})`
    ].join(' \u00b7 ');
  }

  store.subscribe((state, changed) => {
    if (changed.includes('stats') || changed.includes('lastRunMs') || changed.includes('previewMode')) paint();
  });
  paint();
}
