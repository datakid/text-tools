import { createStep } from '../core/workflow.js';
import { findManifest, get as getOp } from '../core/registry.js';
import { defaults, coerce } from '../core/schema.js';
import { categoryOf, RECIPES } from '../core/catalog.js';
import { triggerPreview } from './previewController.js';
import { escapeHtml } from './escape.js';
import { openPalette } from './palette.js';
import { applyRecipe } from './actions.js';
import { toast } from './toast.js';

const describeCache = new Map();

async function describeStep(step) {
  try {
    const op = await getOp(step.op);
    if (typeof op.describe !== 'function') return '';
    const values = coerce(op.params, { ...defaults(op.params), ...step.params });
    return String(op.describe(values) || '');
  } catch {
    return '';
  }
}

export function renderStepsPane(container, store, engine) {
  container.innerHTML = `
    <div class="steps-head">
      <span class="steps-title">Pipeline</span>
      <span class="steps-count mono" id="steps-count"></span>
      <button class="btn btn-ghost btn-xs" id="btn-clear-steps" type="button" title="Remove every step">Clear</button>
    </div>
    <div class="step-list" id="step-list"></div>`;
  const list = container.querySelector('#step-list');
  const countEl = container.querySelector('#steps-count');
  const clearBtn = container.querySelector('#btn-clear-steps');

  clearBtn.addEventListener('click', () => {
    const wf = store.get().workflow;
    if (!wf.steps.length) return;
    const prev = wf.steps;
    store.set({ workflow: { ...wf, steps: [] }, selectedStepId: null });
    triggerPreview(store, engine);
    toast(`Cleared ${prev.length} step${prev.length === 1 ? '' : 's'}`, 'ok', {
      action: 'Undo',
      onAction: () => {
        store.set({ workflow: { ...store.get().workflow, steps: prev } });
        triggerPreview(store, engine);
      }
    });
  });

  function updateStep(stepId, patch) {
    const wf = store.get().workflow;
    store.set({ workflow: { ...wf, steps: wf.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) } });
    triggerPreview(store, engine);
  }

  function paint() {
    const { workflow, selectedStepId, errors } = store.get();
    list.innerHTML = '';
    const enabled = workflow.steps.filter((s) => s.enabled).length;
    countEl.textContent = workflow.steps.length ? `${enabled}/${workflow.steps.length}` : '';
    clearBtn.classList.toggle('hidden', workflow.steps.length === 0);

    workflow.steps.forEach((step, i) => {
      const card = document.createElement('div');
      card.className = 'step-card';
      card.draggable = true;
      card.dataset.stepId = step.id;
      if (step.id === selectedStepId) card.classList.add('selected');
      if (!step.enabled) card.classList.add('disabled');
      const stepError = (errors || []).find((e) => e.stepId === step.id);
      if (stepError) card.classList.add(stepError.hint ? 'has-note' : 'has-error');

      const manifestEntry = findManifest(step.op);
      const label = manifestEntry?.name || step.op;
      const cat = categoryOf(manifestEntry?.group);
      card.style.setProperty('--hue', cat.hue);
      const cached = describeCache.get(`${step.op}|${JSON.stringify(step.params)}`) || '';
      card.innerHTML = `
        <span class="step-num mono" title="${escapeHtml(cat.label)}">${String(i + 1).padStart(2, '0')}</span>
        <span class="step-text">
          <span class="step-name">${escapeHtml(label)}</span>
          <span class="step-desc">${escapeHtml(stepError ? stepError.message : cached)}</span>
        </span>
        <span class="step-tools">
          <button class="btn btn-ghost btn-icon" type="button" data-action="duplicate" title="Duplicate" aria-label="Duplicate step">\u29C9</button>
          <button class="btn btn-ghost btn-icon" type="button" data-action="toggle" title="${step.enabled ? 'Disable' : 'Enable'} (E)" aria-label="${step.enabled ? 'Disable' : 'Enable'} step" aria-pressed="${!step.enabled}">\u23FB</button>
          <button class="btn btn-ghost btn-icon btn-icon-danger" type="button" data-action="delete" title="Delete (Del)" aria-label="Delete step">\u2715</button>
        </span>
      `;
      if (!stepError) {
        describeStep(step).then((desc) => {
          describeCache.set(`${step.op}|${JSON.stringify(step.params)}`, desc);
          const el = card.querySelector('.step-desc');
          if (el && el.textContent !== desc) el.textContent = desc;
        });
      }

      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Step ${i + 1}: ${label}${step.enabled ? '' : ' (disabled)'}`);
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-action]')) return;
        store.set({ selectedStepId: step.id });
      });
      card.addEventListener('keydown', (e) => {
        if (e.target !== card) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); store.set({ selectedStepId: step.id }); }
        else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.altKey) {
          e.preventDefault();
          const wf = store.get().workflow;
          const j = i + (e.key === 'ArrowUp' ? -1 : 1);
          if (j < 0 || j >= wf.steps.length) return;
          const steps = wf.steps.slice();
          [steps[i], steps[j]] = [steps[j], steps[i]];
          store.set({ workflow: { ...wf, steps } });
          triggerPreview(store, engine);
          requestAnimationFrame(() => list.querySelector(`[data-step-id="${step.id}"]`)?.focus());
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const sib = e.key === 'ArrowUp' ? card.previousElementSibling : card.nextElementSibling;
          if (sib?.classList.contains('step-card')) sib.focus();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          const next = card.nextElementSibling?.classList.contains('step-card') ? card.nextElementSibling.dataset.stepId : card.previousElementSibling?.dataset.stepId;
          card.querySelector('[data-action="delete"]').click();
          requestAnimationFrame(() => (next && list.querySelector(`[data-step-id="${next}"]`))?.focus());
        } else if (e.key.toLowerCase() === 'e' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          updateStep(step.id, { enabled: !step.enabled });
          requestAnimationFrame(() => list.querySelector(`[data-step-id="${step.id}"]`)?.focus());
        }
      });

      card.querySelector('[data-action="duplicate"]').addEventListener('click', () => {
        const wf = store.get().workflow;
        const copy = createStep(step.op, JSON.parse(JSON.stringify(step.params || {})));
        copy.enabled = step.enabled;
        const steps = wf.steps.slice();
        steps.splice(i + 1, 0, copy);
        store.set({ workflow: { ...wf, steps }, selectedStepId: copy.id });
        triggerPreview(store, engine);
      });

      card.querySelector('[data-action="toggle"]').addEventListener('click', () => updateStep(step.id, { enabled: !step.enabled }));

      card.querySelector('[data-action="delete"]').addEventListener('click', () => {
        const wf = store.get().workflow;
        const index = wf.steps.findIndex((s) => s.id === step.id);
        const removed = wf.steps[index];
        const nextSelected = store.get().selectedStepId === step.id ? null : store.get().selectedStepId;
        store.set({ workflow: { ...wf, steps: wf.steps.filter((s) => s.id !== step.id) }, selectedStepId: nextSelected });
        triggerPreview(store, engine);
        toast(`Removed \u201C${label}\u201D`, 'ok', {
          action: 'Undo',
          onAction: () => {
            const cur = store.get().workflow;
            const steps = cur.steps.slice();
            steps.splice(Math.min(index, steps.length), 0, removed);
            store.set({ workflow: { ...cur, steps } });
            triggerPreview(store, engine);
          }
        });
      });

      card.addEventListener('dragstart', () => card.classList.add('dragging'));
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        const order = [...list.querySelectorAll('.step-card')].map((el) => el.dataset.stepId);
        const wf = store.get().workflow;
        if (order.join() === wf.steps.map((s) => s.id).join()) return;
        store.set({ workflow: { ...wf, steps: order.map((id) => wf.steps.find((s) => s.id === id)).filter(Boolean) } });
        triggerPreview(store, engine);
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = list.querySelector('.dragging');
        if (!dragging || dragging === card) return;
        const rect = card.getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        list.insertBefore(dragging, before ? card : card.nextSibling);
      });

      list.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'step-add';
    addBtn.id = 'btn-add-step';
    addBtn.setAttribute('aria-haspopup', 'dialog');
    addBtn.innerHTML = `+ <span>Add step</span> <kbd class="kbd-inline">${/Mac|iPhone|iPad/.test(navigator.platform || '') ? '\u2318' : 'Ctrl'} K</kbd>`;
    addBtn.addEventListener('click', () => openPalette(store, engine));
    list.appendChild(addBtn);

    if (workflow.steps.length === 0) {
      const hint = document.createElement('div');
      hint.className = 'steps-empty';
      hint.innerHTML = '<strong>Build a pipeline</strong><span>Click a quick action above the editor, add a step, or start from a recipe:</span>';
      const recipes = document.createElement('div');
      recipes.className = 'recipe-list';
      RECIPES.slice(0, 5).forEach((r) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'recipe-chip';
        b.dataset.recipe = r.id;
        b.innerHTML = `<span class="recipe-name">${escapeHtml(r.name)}</span><span class="recipe-blurb">${escapeHtml(r.blurb)}</span>`;
        b.addEventListener('click', () => applyRecipe(store, engine, r));
        recipes.appendChild(b);
      });
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'btn btn-ghost btn-xs recipe-more';
      more.textContent = `All ${RECIPES.length} recipes \u2192`;
      more.addEventListener('click', () => openPalette(store, engine, { category: 'recipes' }));
      recipes.appendChild(more);
      hint.appendChild(recipes);
      list.appendChild(hint);
    }
  }

  store.subscribe((state, changed) => {
    if (changed.includes('workflow') || changed.includes('selectedStepId') || changed.includes('errors')) paint();
  });
  paint();
}
