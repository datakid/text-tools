import { get as getOp, findManifest } from '../core/registry.js';
import { buildForm } from './formgen.js';
import { triggerPreview } from './previewController.js';
import { escapeHtml } from './escape.js';

export function renderInspectorPane(container, store, engine) {
  let token = 0;
  let selfChange = false;

  async function paint() {
    const myToken = ++token;
    const { workflow, selectedStepId } = store.get();
    const step = workflow.steps.find((s) => s.id === selectedStepId);

    if (!step) {
      container.innerHTML = `
        <div class="inspector-empty">
          <strong>No step selected</strong>
          <span>Pick a step on the left to edit its settings, or add one with <kbd>${navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl'}</kbd> <kbd>K</kbd>.</span>
        </div>`;
      return;
    }

    const op = await getOp(step.op);
    if (myToken !== token) return;
    const entry = findManifest(step.op);
    container.innerHTML = `
      <div class="inspector-head">
        ${entry?.group ? `<span class="inspector-group">${escapeHtml(entry.group)}</span>` : ''}
        <h3 class="inspector-title">${escapeHtml(op.name)}</h3>
        ${op.summary ? `<p class="inspector-summary">${escapeHtml(op.summary)}</p>` : ''}
      </div>
      <div id="inspector-form"></div>
    `;
    const form = container.querySelector('#inspector-form');

    function onChange(key, value) {
      step.params = { ...step.params, [key]: value };
      selfChange = true;
      try {
        store.set({ workflow: { ...store.get().workflow } });
      } finally {
        selfChange = false;
      }

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

      triggerPreview(store, engine);
    }

    if (!op.params || op.params.length === 0) {
      form.innerHTML = '<div class="field-help">This step has no settings.</div>';
      return;
    }
    buildForm(form, op.params, step.params, onChange);
  }

  store.subscribe((state, changed) => {
    if (changed.includes('selectedStepId') || (changed.includes('workflow') && !selfChange)) paint();
  });
  paint();
}
