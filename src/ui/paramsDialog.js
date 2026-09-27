import { openModal } from './modal.js';
import { buildForm } from './formgen.js';
import { triggerRun } from './previewController.js';

function coerceDefault(raw, type) {
  if (type === 'int') return parseInt(raw, 10) || 0;
  if (type === 'float') return parseFloat(raw) || 0;
  if (type === 'bool') return raw === 'true' || raw === true;
  return raw ?? '';
}

export function openParamsEditor(store) {
  const body = document.createElement('div');
  const head = document.createElement('div');
  head.className = 'params-head';
  head.innerHTML = '<span>Key</span><span>Label</span><span>Type</span><span>Default</span><span></span>';
  const listEl = document.createElement('div');
  listEl.className = 'params-list';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'step-add';
  addBtn.innerHTML = '+ <span>Add parameter</span>';
  body.appendChild(head);
  body.appendChild(listEl);
  body.appendChild(addBtn);

  function commit(params) {
    const wf = store.get().workflow;
    store.set({ workflow: { ...wf, params } });
    paint();
  }

  function paint() {
    const params = store.get().workflow.params || [];
    listEl.innerHTML = '';
    params.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'pairs-row params-row';

      const keyInput = document.createElement('input');
      keyInput.type = 'text';
      keyInput.placeholder = 'key';
      keyInput.value = p.key;
      keyInput.setAttribute('aria-label', 'Key');

      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.placeholder = 'label';
      labelInput.value = p.label || '';
      labelInput.setAttribute('aria-label', 'Label');

      const typeSelect = document.createElement('select');
      typeSelect.className = 'picker-select';
      typeSelect.setAttribute('aria-label', 'Type');
      ['string', 'int', 'float', 'bool'].forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        if (p.type === t) opt.selected = true;
        typeSelect.appendChild(opt);
      });

      const defaultInput = document.createElement('input');
      defaultInput.type = 'text';
      defaultInput.placeholder = 'default';
      defaultInput.value = String(p.default ?? '');
      defaultInput.setAttribute('aria-label', 'Default value');

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-ghost btn-icon btn-icon-danger';
      removeBtn.setAttribute('aria-label', 'Remove parameter');
      removeBtn.textContent = '\u2715';

      function update() {
        const next = params.map((row2, j) =>
          j === i
            ? {
                key: keyInput.value.trim(),
                label: labelInput.value.trim() || keyInput.value.trim(),
                type: typeSelect.value,
                default: coerceDefault(defaultInput.value, typeSelect.value)
              }
            : row2
        );
        commit(next);
      }

      keyInput.addEventListener('change', update);
      labelInput.addEventListener('change', update);
      typeSelect.addEventListener('change', update);
      defaultInput.addEventListener('change', update);
      removeBtn.addEventListener('click', () => commit(params.filter((_, j) => j !== i)));

      row.appendChild(keyInput);
      row.appendChild(labelInput);
      row.appendChild(typeSelect);
      row.appendChild(defaultInput);
      row.appendChild(removeBtn);
      listEl.appendChild(row);
    });
    head.classList.toggle('hidden', params.length === 0);
    if (params.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><strong>No parameters yet</strong><span>Reference one from any step field as <code>$key</code>.</span></div>';
    }
  }

  addBtn.addEventListener('click', () => {
    const params = store.get().workflow.params || [];
    commit([...params, { key: `param${params.length + 1}`, label: '', type: 'string', default: '' }]);
  });

  paint();
  openModal('Workflow parameters', body, { subtitle: 'Values you can change each time the pipeline runs.', size: 'lg' });
}

export function runWithParamsIfNeeded(store, engine) {
  const workflow = store.get().workflow;
  if (!workflow.params || workflow.params.length === 0) {
    triggerRun(store, engine);
    return;
  }

  const body = document.createElement('div');
  const formEl = document.createElement('div');
  body.appendChild(formEl);

  const schema = workflow.params.map((p) => ({ key: p.key, type: p.type, label: p.label || p.key, default: p.default }));
  const values = Object.fromEntries(schema.map((p) => [p.key, p.default]));

  buildForm(formEl, schema, values, (key, value) => {
    values[key] = value;
  });

  const runBtn = document.createElement('button');
  runBtn.type = 'button';
  runBtn.className = 'btn btn-primary';
  runBtn.textContent = 'Run';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-ghost';
  cancelBtn.textContent = 'Cancel';

  const modal = openModal('Run with parameters', body, { subtitle: 'Adjust values for this run.', footer: [cancelBtn, runBtn] });
  cancelBtn.addEventListener('click', () => modal.close());
  runBtn.addEventListener('click', () => {
    modal.close();
    triggerRun(store, engine, values);
  });
}
