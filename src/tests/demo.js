const params = new URLSearchParams(location.search || document.documentElement.dataset.demo || '');
const frame = document.getElementById('app-frame');
frame.src = 'index.html?e2e=1';
frame.addEventListener('load', async () => {
  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  const wait = (fn) => new Promise((res) => { const t = setInterval(() => { if (fn()) { clearInterval(t); res(); } }, 40); });
  await wait(() => win.__sluice);
  const input = doc.querySelector('#input-text');
  input.value = 'banana\napple\n  Apple \n\ncherry\nfile10\nfile2';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 400));
  if (params.get('steps') !== '0') {
    doc.querySelector('[data-quick="q-trim"]').click();
    doc.querySelector('[data-quick="q-dedupe"]').click();
    doc.querySelector('[data-quick="q-sort"]').click();
    const { store } = win.__sluice;
    await wait(() => store.get().workflow.steps.length === 3);
    const s = store.get().workflow.steps[1];
    if (s) store.set({ selectedStepId: s.id });
  }
  if (params.get('palette')) {
    await new Promise((r) => setTimeout(r, 300));
    doc.body.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    await wait(() => doc.querySelector('#palette-search'));
    const q = params.get('q');
    if (q) {
      const s = doc.querySelector('#palette-search');
      s.value = q;
      s.dispatchEvent(new win.Event('input', { bubbles: true }));
    }
  }
  await new Promise((r) => setTimeout(r, 900));
  document.documentElement.dataset.ready = 'true';
});
