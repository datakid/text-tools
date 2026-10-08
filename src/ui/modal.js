import { escapeHtml } from './escape.js';

let seq = 0;

export function openModal(title, bodyEl, { onClose, subtitle, footer, size } = {}) {
  const id = `modal-${++seq}`;
  const previous = document.activeElement;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const dialog = document.createElement('div');
  dialog.className = `modal-dialog${size ? ` modal-${size}` : ''}`;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', `${id}-title`);
  dialog.innerHTML = `
    <div class="modal-header">
      <div class="modal-heading">
        <h3 id="${id}-title">${escapeHtml(title)}</h3>
        ${subtitle ? `<p class="modal-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      <button class="btn btn-ghost btn-icon modal-close" type="button" data-close aria-label="Close">\u2715</button>
    </div>
    <div class="modal-body"></div>
  `;
  dialog.querySelector('.modal-body').appendChild(bodyEl);
  if (footer) {
    const foot = document.createElement('div');
    foot.className = 'modal-footer';
    footer.forEach((b) => foot.appendChild(b));
    dialog.appendChild(foot);
  }
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  document.body.classList.add('modal-open');

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey, true);
    backdrop.classList.add('closing');
    if (!document.querySelector('.modal-backdrop:not(.closing)')) document.body.classList.remove('modal-open');
    const done = () => {
      backdrop.remove();
      if (!document.querySelector('.modal-backdrop:not(.closing)')) document.body.classList.remove('modal-open');
      if (previous && previous.focus) previous.focus();
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) done();
    else setTimeout(done, 160);
    onClose?.();
  }

  function focusables() {
    return [...dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.disabled && el.offsetParent !== null);
  }

  function onKey(e) {
    if (backdrop !== [...document.querySelectorAll('.modal-backdrop:not(.closing)')].pop()) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) close();
  });
  dialog.querySelector('[data-close]').addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);

  requestAnimationFrame(() => {
    const target = dialog.querySelector('[autofocus]') || focusables().find((el) => !el.hasAttribute('data-close')) || dialog.querySelector('[data-close]');
    target?.focus();
  });

  return { close, dialog };
}

function button(label, cls) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn ${cls}`;
  b.textContent = label;
  return b;
}

export function promptDialog(title, { label = 'Name', value = '', confirmText = 'Save', subtitle } = {}) {
  return new Promise((resolve) => {
    const form = document.createElement('form');
    form.className = 'field';
    form.innerHTML = `<label for="prompt-input">${escapeHtml(label)}</label><input id="prompt-input" type="text" autocomplete="off" autofocus>`;
    const input = form.querySelector('input');
    input.value = value;
    const cancel = button('Cancel', 'btn-ghost');
    const ok = button(confirmText, 'btn-primary');
    let result = null;
    const modal = openModal(title, form, { subtitle, footer: [cancel, ok], size: 'sm', onClose: () => resolve(result) });
    const submit = () => {
      const v = input.value.trim();
      if (!v) { input.focus(); form.classList.add('has-error'); return; }
      result = v;
      modal.close();
    };
    requestAnimationFrame(() => input.select());
    input.addEventListener('input', () => form.classList.remove('has-error'));
    form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
    ok.addEventListener('click', submit);
    cancel.addEventListener('click', () => modal.close());
  });
}

export function confirmDialog(title, { message = '', confirmText = 'Confirm', danger = false } = {}) {
  return new Promise((resolve) => {
    const p = document.createElement('p');
    p.className = 'modal-message';
    p.textContent = message;
    const cancel = button('Cancel', 'btn-ghost');
    const ok = button(confirmText, danger ? 'btn-danger' : 'btn-primary');
    ok.setAttribute('autofocus', '');
    let result = false;
    const modal = openModal(title, p, { footer: [cancel, ok], size: 'sm', onClose: () => resolve(result) });
    ok.addEventListener('click', () => { result = true; modal.close(); });
    cancel.addEventListener('click', () => modal.close());
  });
}

export function alertDialog(title, message) {
  return new Promise((resolve) => {
    const p = document.createElement('p');
    p.className = 'modal-message';
    p.textContent = message;
    const ok = button('OK', 'btn-primary');
    ok.setAttribute('autofocus', '');
    const modal = openModal(title, p, { footer: [ok], size: 'sm', onClose: resolve });
    ok.addEventListener('click', () => modal.close());
  });
}
