let host = null;

export function toast(message, kind = 'ok', { action, onAction, duration } = {}) {
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-host';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  const text = document.createElement('span');
  text.textContent = message;
  el.appendChild(text);
  let timer = null;
  const dismiss = () => {
    clearTimeout(timer);
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 200);
  };
  if (action && onAction) {
    el.classList.add('toast-actionable');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = action;
    btn.addEventListener('click', () => {
      onAction();
      dismiss();
    });
    el.appendChild(btn);
  }
  host.appendChild(el);
  timer = setTimeout(dismiss, duration || (action ? 6000 : 2400));
  return dismiss;
}
