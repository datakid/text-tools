import { createStep } from '../core/workflow.js';
import { listGroups, findManifest, get as getOp } from '../core/registry.js';
import { defaults } from '../core/schema.js';
import { triggerPreview } from './previewController.js';
import { escapeHtml } from './escape.js';
import { openPicker as openMenu } from './picker.js';

export function renderStepsPane(container, store, engine) {
  container.innerHTML = '<div class="step-list" id="step-list"></div>';
  const list = container.querySelector('#step-list');

  function paint() {
    const { workflow, selectedStepId, errors } = store.get();
    list.innerHTML = '';

    workflow.steps.forEach((step, i) => {
      const card = document.createElement('div');
      card.className = 'step-card';
      card.draggable = true;
      card.dataset.stepId = step.id;
      if (step.id === selectedStepId) card.classList.add('selected');
      if (!step.enabled) card.classList.add('disabled');
      if ((errors || []).some((e) => e.stepId === step.id)) card.classList.add('has-error');

      const manifestEntry = findManifest(step.op);
      const label = manifestEntry?.name || step.op;
      const costBadge =
        manifestEntry?.cost === 'quadratic'
          ? '<span class="cost-badge" title="Quadratic cost \u2014 can be slow on large input">\u26A0</span>'
          : '';
      card.innerHTML = `
        <span class="step-num mono">${String(i + 1).padStart(2, '0')}</span>
        <span class="step-name">${escapeHtml(label)}</span>
        ${costBadge}
        <button class="btn btn-ghost btn-icon" type="button" data-action="duplicate" title="Duplicate" aria-label="Duplicate step">\u29C9</button>
        <button class="btn btn-ghost btn-icon" type="button" data-action="toggle" title="${step.enabled ? 'Disable' : 'Enable'}" aria-label="${step.enabled ? 'Disable' : 'Enable'} step" aria-pressed="${!step.enabled}">\u23FB</button>
        <button class="btn btn-ghost btn-icon btn-icon-danger" type="button" data-action="delete" title="Delete" aria-label="Delete step">\u2715</button>
      `;

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
          card.querySelector('[data-action="delete"]').click();
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

      card.querySelector('[data-action="toggle"]').addEventListener('click', () => {
        const wf = store.get().workflow;
        store.set({ workflow: { ...wf, steps: wf.steps.map((s) => (s.id === step.id ? { ...s, enabled: !s.enabled } : s)) } });
        triggerPreview(store, engine);
      });

      card.querySelector('[data-action="delete"]').addEventListener('click', () => {
        const wf = store.get().workflow;
        const nextSelected = store.get().selectedStepId === step.id ? null : store.get().selectedStepId;
        store.set({ workflow: { ...wf, steps: wf.steps.filter((s) => s.id !== step.id) }, selectedStepId: nextSelected });
        triggerPreview(store, engine);
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

    if (workflow.steps.length === 0) {
      const hint = document.createElement('div');
      hint.className = 'steps-empty';
      hint.innerHTML = '<strong>Build a pipeline</strong><span>Add steps to transform your text, one after another.</span>';
      list.appendChild(hint);
    }

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'step-add';
    addBtn.id = 'btn-add-step';
    addBtn.setAttribute('aria-haspopup', 'listbox');
    addBtn.innerHTML = '+ <span>Add step</span>';
    addBtn.addEventListener('click', () => openAddPicker(addBtn));
    list.appendChild(addBtn);
  }

  function openAddPicker(anchor) {
    const groups = [...listGroups()].map(([group, entries]) => [group, entries.map((e) => ({ label: e.name, value: e.id, keywords: e.id }))]);
    openMenu(anchor, groups, async (id) => {
      const op = await getOp(id);
      const wf = store.get().workflow;
      const step = createStep(id, defaults(op.params));
      store.set({ workflow: { ...wf, steps: [...wf.steps, step] }, selectedStepId: step.id });
      triggerPreview(store, engine);
    }, { placeholder: 'Search 100+ tools\u2026' });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !document.body.classList.contains('modal-open')) {
      e.preventDefault();
      const btn = list.querySelector('#btn-add-step');
      if (!btn) return;
      if (btn.offsetParent === null) {
        document.querySelector('#btn-pipeline')?.click();
        requestAnimationFrame(() => openAddPicker(list.querySelector('#btn-add-step')));
      } else openAddPicker(btn);
    }
  });

  store.subscribe((state, changed) => {
    if (changed.includes('workflow') || changed.includes('selectedStepId') || changed.includes('errors')) paint();
  });
  paint();
}
