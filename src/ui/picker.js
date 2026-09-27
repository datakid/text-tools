let current = null;

export function closePicker() {
  if (current) current();
}

export function openPicker(anchor, groups, onPick, { searchable = true, placeholder = 'Search\u2026' } = {}) {
  closePicker();
  const picker = document.createElement('div');
  picker.className = 'picker';
  picker.setAttribute('role', 'dialog');

  let search = null;
  if (searchable) {
    search = document.createElement('input');
    search.type = 'search';
    search.className = 'picker-search';
    search.placeholder = placeholder;
    search.setAttribute('aria-label', placeholder);
    search.autocomplete = 'off';
    picker.appendChild(search);
  }

  const list = document.createElement('div');
  list.className = 'picker-list';
  list.setAttribute('role', 'listbox');
  picker.appendChild(list);

  let items = [];
  let active = 0;

  function setActive(i) {
    if (!items.length) return;
    active = (i + items.length) % items.length;
    items.forEach((el, j) => el.classList.toggle('active', j === active));
    items[active].scrollIntoView({ block: 'nearest' });
  }

  function render(q = '') {
    const needle = q.trim().toLowerCase();
    list.innerHTML = '';
    items = [];
    for (const [group, entries] of groups) {
      const hits = entries.filter((e) => !needle || e.label.toLowerCase().includes(needle) || group.toLowerCase().includes(needle) || (e.keywords || '').toLowerCase().includes(needle));
      if (!hits.length) continue;
      if (group) {
        const h = document.createElement('div');
        h.className = 'picker-group';
        h.textContent = group;
        list.appendChild(h);
      }
      for (const entry of hits) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'picker-item';
        item.setAttribute('role', 'option');
        item.textContent = entry.label;
        if (entry.selected) item.setAttribute('aria-selected', 'true');
        item.addEventListener('click', () => { close(); onPick(entry.value); });
        item.addEventListener('mousemove', () => setActive(items.indexOf(item)));
        list.appendChild(item);
        items.push(item);
      }
    }
    if (!items.length) {
      list.innerHTML = '<div class="picker-empty">No matches</div>';
    }
    setActive(0);
  }

  function place() {
    const r = anchor.getBoundingClientRect();
    const w = picker.offsetWidth;
    const h = picker.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = Math.min(r.left, vw - w - 8);
    let top = r.bottom + 6;
    if (top + h > vh - 8 && r.top - h - 6 > 8) {
      top = r.top - h - 6;
      picker.style.transformOrigin = 'bottom left';
    }
    picker.style.left = `${Math.max(8, left)}px`;
    picker.style.top = `${Math.max(8, Math.min(top, vh - h - 8))}px`;
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); anchor.focus?.(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter' && items[active] && (e.target === search || picker.contains(e.target))) { e.preventDefault(); items[active].click(); }
  }

  function onDown(e) {
    if (!picker.contains(e.target) && !anchor.contains(e.target)) close();
  }

  function close() {
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('mousedown', onDown, true);
    window.removeEventListener('resize', close);
    anchor.setAttribute?.('aria-expanded', 'false');
    picker.remove();
    if (current === close) current = null;
  }

  render();
  document.body.appendChild(picker);
  place();
  anchor.setAttribute?.('aria-expanded', 'true');
  current = close;
  if (search) {
    search.addEventListener('input', () => { render(search.value); place(); });
    search.focus();
  } else {
    items.find((el) => el.getAttribute('aria-selected') === 'true')?.focus() || items[0]?.focus();
  }
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('mousedown', onDown, true);
  window.addEventListener('resize', close);
  return close;
}
