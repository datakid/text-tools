import { openPicker } from './picker.js';

const MAX_VISIBLE_DOC_TABS = 6;

export function renderDocTabs(container, docsMeta, activeIndex, onSelect) {
  container.innerHTML = '';
  const visible = docsMeta.slice(0, MAX_VISIBLE_DOC_TABS);
  const overflow = docsMeta.slice(MAX_VISIBLE_DOC_TABS);

  visible.forEach((d, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');
    tab.className = `doc-tab${i === activeIndex ? ' active' : ''}`;
    tab.textContent = d.name;
    tab.addEventListener('click', () => onSelect(i));
    container.appendChild(tab);
  });

  if (overflow.length > 0) {
    const more = document.createElement('button');
    more.type = 'button';
    more.className = `doc-tab${activeIndex >= MAX_VISIBLE_DOC_TABS ? ' active' : ''}`;
    more.setAttribute('aria-haspopup', 'listbox');
    more.textContent = activeIndex >= MAX_VISIBLE_DOC_TABS ? `${docsMeta[activeIndex]?.name} \u25BE` : `+${overflow.length} more \u25BE`;
    more.addEventListener('click', () => openDocPicker(more, docsMeta, onSelect));
    container.appendChild(more);
  }
}

function openDocPicker(anchor, docsMeta, onSelect) {
  const entries = docsMeta.map((d, i) => ({ label: d.name, value: i }));
  openPicker(anchor, [['', entries]], onSelect, { searchable: docsMeta.length > 8, placeholder: 'Find document\u2026' });
}
