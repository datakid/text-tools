import { get as getOp, findManifest } from '../core/registry.js';
import { defaults } from '../core/schema.js';
import { categoryOf } from '../core/catalog.js';
import { isFavorite, toggleFavorite } from '../core/prefs.js';
import { buildForm } from './formgen.js';
import { triggerPreview } from './previewController.js';
import { escapeHtml } from './escape.js';
import { toast } from './toast.js';

function visible(s) {
  return String(s).replace(/\t/g, '\u2192').replace(/\r/g, '');
}

export function renderInspectorPane(container, store, engine) {
  let token = 0;
  let selfChange = false;

  async function paint() {
    const myToken = ++token;
    const { workflow, selectedStepId } = store.get();
    const stepIndex = workflow.steps.findIndex((s) => s.id === selectedStepId);
    const step = workflow.steps[stepIndex];
    const mod = /Mac|iPhone|iPad/.test(navigator.platform || '') ? '\u2318' : 'Ctrl';

    if (!step) {
      container.innerHTML = `
        <div class="inspector-empty">
          <strong>No step selected</strong>
          <span>Pick a step on the left to edit its settings.</span>
        </div>
        <section class="shortcut-card" aria-labelledby="shortcut-title">
          <h4 id="shortcut-title">Shortcuts</h4>
          <dl>
            <dt><kbd>${mod}</kbd> <kbd>K</kbd></dt><dd>Action library</dd>
            <dt><kbd>${mod}</kbd> <kbd>\u21B5</kbd></dt><dd>Run on full input</dd>
            <dt><kbd>${mod}</kbd> <kbd>\u21E7</kbd> <kbd>C</kbd></dt><dd>Copy output</dd>
            <dt><kbd>${mod}</kbd> <kbd>Z</kbd></dt><dd>Undo pipeline change</dd>
            <dt><kbd>Alt</kbd> <kbd>\u2191\u2193</kbd></dt><dd>Reorder focused step</dd>
            <dt><kbd>E</kbd> / <kbd>Del</kbd></dt><dd>Toggle / delete step</dd>
            <dt><kbd>?</kbd></dt><dd>All shortcuts</dd>
          </dl>
        </section>`;
      return;
    }

    const op = await getOp(step.op);
    if (myToken !== token) return;
    const entry = findManifest(step.op);
    const cat = categoryOf(entry?.group);
    const fav = isFavorite(step.op);
    container.style.setProperty('--hue', cat.hue);
    container.innerHTML = `
      <div class="inspector-head">
        <div class="inspector-topline">
          <span class="inspector-group">${escapeHtml(cat.label)}</span>
          <span class="inspector-nav">
            <button class="btn btn-ghost btn-icon btn-xs" type="button" data-nav="-1" aria-label="Previous step" ${stepIndex === 0 ? 'disabled' : ''}>\u2039</button>
            <span class="mono inspector-pos">${stepIndex + 1}/${workflow.steps.length}</span>
            <button class="btn btn-ghost btn-icon btn-xs" type="button" data-nav="1" aria-label="Next step" ${stepIndex === workflow.steps.length - 1 ? 'disabled' : ''}>\u203A</button>
          </span>
        </div>
        <h3 class="inspector-title">${escapeHtml(op.name)}</h3>
        ${op.summary ? `<p class="inspector-summary">${escapeHtml(op.summary)}</p>` : ''}
        <div class="inspector-tools">
          <button class="btn btn-ghost btn-xs${fav ? ' is-on' : ''}" type="button" id="btn-fav-step" aria-pressed="${fav}">${fav ? '\u2605 Favorite' : '\u2606 Favorite'}</button>
          <button class="btn btn-ghost btn-xs" type="button" id="btn-reset-step" ${op.params?.length ? '' : 'disabled'}>Reset settings</button>
          <button class="btn btn-ghost btn-xs" type="button" id="btn-toggle-step">${step.enabled ? 'Disable' : 'Enable'}</button>
        </div>
      </div>
      <div id="inspector-form"></div>
      <div id="inspector-examples"></div>
    `;
    const form = container.querySelector('#inspector-form');

    container.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => {
      const next = workflow.steps[stepIndex + Number(b.dataset.nav)];
      if (next) store.set({ selectedStepId: next.id });
    }));
    container.querySelector('#btn-fav-step').addEventListener('click', () => {
      const on = toggleFavorite(step.op);
      toast(on ? 'Pinned to favorites & quick bar' : 'Removed from favorites');
      paint();
    });
    container.querySelector('#btn-reset-step').addEventListener('click', () => {
      commitParams(defaults(op.params));
      paint();
    });
    container.querySelector('#btn-toggle-step').addEventListener('click', () => {
      const wf = store.get().workflow;
      store.set({ workflow: { ...wf, steps: wf.steps.map((s) => (s.id === step.id ? { ...s, enabled: !s.enabled } : s)) } });
      triggerPreview(store, engine);
    });

    function commitParams(params) {
      const wf = store.get().workflow;
      selfChange = true;
      try {
        store.set({ workflow: { ...wf, steps: wf.steps.map((s) => (s.id === step.id ? { ...s, params } : s)) } });
      } finally {
        selfChange = false;
      }
      step.params = params;
      triggerPreview(store, engine);
    }

    function onChange(key, value) {
      commitParams({ ...step.params, [key]: value });

      const active = form.querySelector(':focus');
      const activeId = active?.id;
      const selStart = active?.selectionStart;
      const selEnd = active?.selectionEnd;

      buildForm(form, op.params, step.params, onChange);

      if (activeId) {
        const el = form.querySelector(`#${CSS.escape(activeId)}`);
        if (el) {
          el.focus();
          if (selStart != null && el.setSelectionRange) {
            try {
              el.setSelectionRange(selStart, selEnd ?? selStart);
            } catch {}
          }
        }
      }
    }

    if (!op.params || op.params.length === 0) {
      form.innerHTML = '<div class="field-help">This step has no settings.</div>';
    } else {
      buildForm(form, op.params, { ...defaults(op.params), ...step.params }, onChange);
    }

    const examples = (op.examples || []).filter((ex) => ex.in.length === 1 && ex.out.length === 1 && ex.in[0] !== '' && !String(ex.out[0]).startsWith('__error__')).slice(0, 2);
    const exEl = container.querySelector('#inspector-examples');
    if (examples.length) {
      exEl.innerHTML = '<h4 class="examples-title">Examples</h4>';
      examples.forEach((ex) => {
        const card = document.createElement('div');
        card.className = 'example-card';
        card.innerHTML = '<pre class="example-in"></pre><span class="example-arrow" aria-hidden="true">\u2193</span><pre class="example-out"></pre>';
        card.querySelector('.example-in').textContent = visible(ex.in[0]);
        card.querySelector('.example-out').textContent = visible(ex.out[0]) || '(empty)';
        if (op.params?.length && Object.keys(ex.params || {}).length) {
          const use = document.createElement('button');
          use.type = 'button';
          use.className = 'btn btn-ghost btn-xs example-use';
          use.textContent = 'Use these settings';
          use.addEventListener('click', () => {
            commitParams({ ...defaults(op.params), ...ex.params });
            paint();
          });
          card.appendChild(use);
        }
        exEl.appendChild(card);
      });
    }
  }

  store.subscribe((state, changed) => {
    if (changed.includes('selectedStepId') || (changed.includes('workflow') && !selfChange)) paint();
  });
  paint();
}
