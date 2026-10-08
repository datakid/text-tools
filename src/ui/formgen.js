import { validate, visibleParams } from '../core/schema.js';
import { encodeEscapes, decodeEscapes, isMultilineParam } from '../core/escapes.js';

export function buildForm(container, paramsSchema, values, onChange) {
  container.innerHTML = '';
  const errors = validate(paramsSchema, values);

  for (const p of visibleParams(paramsSchema, values)) {
    const field = document.createElement('div');
    field.className = 'field';

    const label = document.createElement('label');
    label.textContent = p.label;
    label.htmlFor = `f-${p.key}`;
    field.appendChild(label);

    let input;
    let hints = null;

    if (p.type === 'pairs') {
      const editor = document.createElement('div');
      editor.className = 'pairs-editor';
      const rows = Array.isArray(values[p.key]) ? values[p.key] : [];

      const commit = (nextRows) => onChange(p.key, nextRows);

      rows.forEach((row, i) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'pairs-row';

        const findInput = document.createElement('input');
        findInput.type = 'text';
        findInput.placeholder = 'find';
        findInput.value = row.find ?? '';
        findInput.addEventListener('input', () => {
          commit(rows.map((r, j) => (j === i ? { ...r, find: findInput.value } : r)));
        });

        const replaceInput = document.createElement('input');
        replaceInput.type = 'text';
        replaceInput.placeholder = 'replace';
        replaceInput.value = row.replace ?? '';
        replaceInput.addEventListener('input', () => {
          commit(rows.map((r, j) => (j === i ? { ...r, replace: replaceInput.value } : r)));
        });

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-ghost btn-icon';
        removeBtn.textContent = '\u2715';
        removeBtn.addEventListener('click', () => commit(rows.filter((_, j) => j !== i)));

        rowEl.appendChild(findInput);
        rowEl.appendChild(replaceInput);
        rowEl.appendChild(removeBtn);
        editor.appendChild(rowEl);
      });

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-ghost pairs-add';
      addBtn.textContent = '+ add pair';
      addBtn.addEventListener('click', () => commit([...rows, { find: '', replace: '' }]));
      editor.appendChild(addBtn);

      field.appendChild(editor);
      container.appendChild(field);
      continue;
    }

    if (p.type === 'enum') {
      input = document.createElement('select');
      for (const [val, text] of p.options) {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = text;
        if (values[p.key] === val) opt.selected = true;
        input.appendChild(opt);
      }
      input.addEventListener('change', () => onChange(p.key, input.value));
    } else if (p.type === 'bool') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = Boolean(values[p.key]);
      input.addEventListener('change', () => onChange(p.key, input.checked));
    } else if (p.type === 'int' || p.type === 'float') {
      input = document.createElement('input');
      input.type = 'number';
      if (p.min != null) input.min = p.min;
      if (p.max != null) input.max = p.max;
      if (p.type === 'float') input.step = 'any';
      input.value = values[p.key];
      input.addEventListener('input', () => {
        const parsed = p.type === 'int' ? parseInt(input.value, 10) : parseFloat(input.value);
        onChange(p.key, parsed);
      });
    } else if (p.type === 'code' || ((p.type === 'template' || p.type === 'string') && isMultilineParam(p))) {
      input = document.createElement('textarea');
      input.className = 'code-input';
      input.spellcheck = false;
      input.rows = p.type === 'code' ? 8 : 4;
      input.value = values[p.key] ?? '';
      input.addEventListener('input', () => onChange(p.key, input.value));
    } else if (p.type === 'regex') {
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'mono-input';
      input.spellcheck = false;
      input.value = values[p.key] ?? '';
      input.addEventListener('input', () => onChange(p.key, input.value));
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.spellcheck = false;
      input.value = encodeEscapes(values[p.key]);
      input.addEventListener('input', () => onChange(p.key, decodeEscapes(input.value)));
      if (!p.help && /separator|delimiter|gap|prefix|suffix|replace with|find$/i.test(p.label || '')) {
        hints = document.createElement('div');
        hints.className = 'field-help';
        hints.textContent = 'Type \\n for a newline, \\t for a tab.';
      }

      if (p.type === 'template' && p.tokens?.length) {
        hints = document.createElement('div');
        hints.className = 'token-hints';
        for (const tok of p.tokens) {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'chip';
          chip.textContent = tok;
          chip.addEventListener('click', () => {
            input.value += tok;
            onChange(p.key, decodeEscapes(input.value));
          });
          hints.appendChild(chip);
        }
      }
    }

    input.id = `f-${p.key}`;
    field.appendChild(input);
    if (hints) field.appendChild(hints);

    if (p.help) {
      const help = document.createElement('div');
      help.className = 'field-help';
      help.textContent = p.help;
      field.appendChild(help);
    }

    if (errors[p.key]) {
      const err = document.createElement('div');
      err.className = 'field-error';
      err.textContent = errors[p.key];
      field.appendChild(err);
      field.classList.add('has-error');
    }

    container.appendChild(field);
  }
}
