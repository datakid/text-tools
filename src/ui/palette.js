import { MANIFEST } from '../ops/index.js';
import { CATEGORIES, RECIPES, categoryOf, entriesByCategory, searchEntries, searchRecipes } from '../core/catalog.js';
import { get as getOp } from '../core/registry.js';
import { defaults, coerce } from '../core/schema.js';
import { getFavorites, getRecent, toggleFavorite, isFavorite, pushRecent } from '../core/prefs.js';
import { addStep, applyRecipe, getInputBridge } from './actions.js';
import { escapeHtml } from './escape.js';
import { toast } from './toast.js';

const PREVIEW_CHARS = 4000;
const PREVIEW_LINES = 14;
let openInstance = null;

function makeCtx() {
  return {
    progress() {},
    throwIfCancelled() {},
    log() {},
    warn() {},
    resolveTemplate: (s) => s,
    rng(seed) {
      let s = (seed >>> 0) || 1;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
    }
  };
}

export async function previewOp(opId, text, params = {}) {
  const op = await getOp(opId);
  const values = coerce(op.params, { ...defaults(op.params), ...params });
  const docs = [{ id: 'p0', name: 'input', text, meta: {} }];
  const out = await op.run(docs, values, makeCtx());
  return { op, docs: out };
}

function clip(text) {
  const lines = String(text).split(/\r\n|\r|\n/);
  const shown = lines.slice(0, PREVIEW_LINES).join('\n');
  return { shown, more: Math.max(0, lines.length - PREVIEW_LINES) };
}

export function isPaletteOpen() {
  return Boolean(openInstance);
}

export function closePalette() {
  openInstance?.close();
}

export function openPalette(store, engine, { category = 'all', query = '' } = {}) {
  if (openInstance) {
    openInstance.focusSearch();
    return openInstance;
  }
  const previous = document.activeElement;
  const backdrop = document.createElement('div');
  backdrop.className = 'palette-backdrop';
  backdrop.innerHTML = `
    <section class="palette" role="dialog" aria-modal="true" aria-labelledby="palette-title" id="action-palette">
      <header class="palette-head">
        <h2 id="palette-title" class="sr-only">Action library</h2>
        <input type="search" id="palette-search" class="palette-search" placeholder="Search ${MANIFEST.length} actions \u2014 try \u201Cdedupe\u201D, \u201Cjson\u201D, \u201Csql\u201D\u2026" autocomplete="off" spellcheck="false" aria-label="Search actions" aria-controls="palette-list">
        <button type="button" class="btn btn-ghost btn-icon" data-close aria-label="Close action library">\u2715</button>
      </header>
      <div class="palette-body">
        <nav class="palette-rail" id="palette-rail" aria-label="Action categories"></nav>
        <div class="palette-list" id="palette-list" role="listbox" aria-label="Actions"></div>
        <aside class="palette-detail" id="palette-detail" aria-live="polite"></aside>
      </div>
      <footer class="palette-foot">
        <span><kbd>\u2191</kbd><kbd>\u2193</kbd> move</span>
        <span><kbd>\u21B5</kbd> add step</span>
        <span><kbd>\u21E7</kbd><kbd>\u21B5</kbd> apply to input now</span>
        <span><kbd>Alt</kbd><kbd>\u2190</kbd><kbd>\u2192</kbd> category</span>
        <span><kbd>Alt</kbd><kbd>S</kbd> star</span>
        <span><kbd>Esc</kbd> close</span>
      </footer>
    </section>
  `;
  document.body.appendChild(backdrop);
  document.body.classList.add('palette-open');

  const search = backdrop.querySelector('#palette-search');
  const rail = backdrop.querySelector('#palette-rail');
  const list = backdrop.querySelector('#palette-list');
  const detail = backdrop.querySelector('#palette-detail');

  let activeCategory = category;
  let items = [];
  let active = 0;
  let detailToken = 0;
  let detailTimer = null;

  function railEntries() {
    const byCat = entriesByCategory();
    return [
      { id: 'all', label: 'All actions', glyph: '\u2630', count: MANIFEST.length },
      { id: 'favorites', label: 'Favorites', glyph: '\u2605', count: getFavorites().length },
      { id: 'recent', label: 'Recent', glyph: '\u29D6', count: getRecent().length },
      { id: 'recipes', label: 'Recipes', glyph: '\u2318', count: RECIPES.length },
      { divider: true },
      ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, glyph: c.glyph, hue: c.hue, count: byCat.get(c.id)?.length || 0 }))
    ];
  }

  function paintRail() {
    rail.innerHTML = '';
    for (const r of railEntries()) {
      if (r.divider) {
        const hr = document.createElement('div');
        hr.className = 'palette-rail-divider';
        rail.appendChild(hr);
        continue;
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `rail-item${r.id === activeCategory ? ' active' : ''}`;
      b.dataset.category = r.id;
      if (r.hue != null) b.style.setProperty('--hue', r.hue);
      b.setAttribute('aria-pressed', String(r.id === activeCategory));
      b.innerHTML = `<span class="rail-glyph" aria-hidden="true">${escapeHtml(r.glyph)}</span><span class="rail-label">${escapeHtml(r.label)}</span><span class="rail-count">${r.count}</span>`;
      b.addEventListener('click', () => {
        activeCategory = r.id;
        if (search.value) search.value = '';
        paintRail();
        paintList();
        search.focus();
      });
      rail.appendChild(b);
    }
    rail.querySelector('.rail-item.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function currentRows() {
    const q = search.value.trim();
    if (q) {
      const recipes = searchRecipes(q).map((r) => ({ kind: 'recipe', recipe: r }));
      const ops = searchEntries(q).map((e) => ({ kind: 'op', entry: e }));
      return [{ title: `${ops.length} action${ops.length === 1 ? '' : 's'}`, rows: ops }, ...(recipes.length ? [{ title: 'Recipes', rows: recipes }] : [])];
    }
    if (activeCategory === 'recipes') return [{ title: 'Recipes \u2014 multi-step pipelines', rows: RECIPES.map((r) => ({ kind: 'recipe', recipe: r })) }];
    if (activeCategory === 'favorites' || activeCategory === 'recent') {
      const ids = activeCategory === 'favorites' ? getFavorites() : getRecent();
      return [{ title: activeCategory === 'favorites' ? 'Favorites' : 'Recently used', rows: ids.map((id) => ({ kind: 'op', entry: MANIFEST.find((m) => m.id === id) })).filter((r) => r.entry), empty: activeCategory === 'favorites' ? 'Star an action with \u2605 or Alt+S to pin it here and to the quick bar.' : 'Actions you add will show up here.' }];
    }
    const byCat = entriesByCategory();
    if (activeCategory === 'all') {
      return CATEGORIES.map((c) => ({ title: c.label, category: c, rows: (byCat.get(c.id) || []).map((e) => ({ kind: 'op', entry: e })) }));
    }
    const c = categoryOf(activeCategory);
    return [{ title: c.label, category: c, rows: (byCat.get(c.id) || []).map((e) => ({ kind: 'op', entry: e })) }];
  }

  function paintList() {
    const sections = currentRows();
    list.innerHTML = '';
    items = [];
    for (const section of sections) {
      if (!section.rows.length && !section.empty) continue;
      const h = document.createElement('div');
      h.className = 'palette-section';
      h.textContent = section.title;
      list.appendChild(h);
      if (!section.rows.length) {
        const e = document.createElement('div');
        e.className = 'palette-empty';
        e.textContent = section.empty;
        list.appendChild(e);
        continue;
      }
      for (const row of section.rows) {
        const el = document.createElement('div');
        el.className = 'palette-item';
        el.setAttribute('role', 'option');
        el.tabIndex = -1;
        if (row.kind === 'recipe') {
          el.dataset.recipe = row.recipe.id;
          el.innerHTML = `<span class="item-glyph item-glyph-recipe" aria-hidden="true">\u2318</span><span class="item-main"><span class="item-name">${escapeHtml(row.recipe.name)}</span><span class="item-summary">${escapeHtml(row.recipe.blurb)} \u00b7 ${row.recipe.steps.length} steps</span></span>`;
        } else {
          const c = categoryOf(row.entry.group);
          el.dataset.op = row.entry.id;
          el.style.setProperty('--hue', c.hue);
          const fav = isFavorite(row.entry.id);
          el.innerHTML = `<span class="item-glyph" aria-hidden="true">${escapeHtml(c.glyph)}</span><span class="item-main"><span class="item-name">${escapeHtml(row.entry.name)}</span><span class="item-summary" data-summary-for="${escapeHtml(row.entry.id)}">${escapeHtml(c.label)}</span></span><button type="button" class="item-star${fav ? ' on' : ''}" aria-label="${fav ? 'Remove from' : 'Add to'} favorites" aria-pressed="${fav}" tabindex="-1">${fav ? '\u2605' : '\u2606'}</button>`;
          el.querySelector('.item-star').addEventListener('click', (e) => {
            e.stopPropagation();
            star(row.entry.id);
          });
        }
        el._row = row;
        el.addEventListener('click', (e) => choose(row, { apply: e.shiftKey }));
        el.addEventListener('mousemove', () => {
          const i = items.indexOf(el);
          if (i !== active) setActive(i, false);
        });
        list.appendChild(el);
        items.push(el);
      }
    }
    if (!items.length && !list.children.length) {
      list.innerHTML = `<div class="palette-empty"><strong>No actions match \u201C${escapeHtml(search.value)}\u201D</strong><br>Try a broader word like \u201Cline\u201D, \u201Cjson\u201D or \u201Cremove\u201D.</div>`;
    }
    setActive(0, false);
    hydrateSummaries();
  }

  async function hydrateSummaries() {
    const els = [...list.querySelectorAll('[data-summary-for]')];
    for (const el of els) {
      const id = el.dataset.summaryFor;
      getOp(id).then((op) => {
        if (el.isConnected && op.summary) el.textContent = op.summary;
      }).catch(() => {});
    }
  }

  function setActive(i, scroll = true) {
    if (!items.length) {
      detail.innerHTML = '';
      return;
    }
    active = (i + items.length) % items.length;
    items.forEach((el, j) => {
      el.classList.toggle('active', j === active);
      el.setAttribute('aria-selected', String(j === active));
    });
    if (scroll) items[active].scrollIntoView({ block: 'nearest' });
    search.setAttribute('aria-activedescendant', '');
    clearTimeout(detailTimer);
    const target = items[active];
    detailTimer = setTimeout(() => {
      if (openInstance && target?.isConnected && target._row) paintDetail(target._row);
    }, 60);
  }

  async function paintDetail(row) {
    const myToken = ++detailToken;
    const input = getInputBridge()?.get() || '';
    if (row.kind === 'recipe') {
      const names = row.recipe.steps.map(([id]) => MANIFEST.find((m) => m.id === id)?.name || id);
      detail.innerHTML = `
        <span class="detail-cat">Recipe</span>
        <h3 class="detail-title">${escapeHtml(row.recipe.name)}</h3>
        <p class="detail-summary">${escapeHtml(row.recipe.blurb)}</p>
        <ol class="detail-steps">${names.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ol>
        <div class="detail-actions"><button type="button" class="btn btn-primary" data-act="add">Load recipe</button><button type="button" class="btn" data-act="append">Append steps</button></div>
        <p class="detail-note">Loading replaces the current steps${row.recipe.sample ? '; sample text is filled in if your input is empty' : ''}.</p>`;
      detail.querySelector('[data-act="add"]').addEventListener('click', () => choose(row));
      detail.querySelector('[data-act="append"]').addEventListener('click', () => choose(row, { append: true }));
      return;
    }
    const id = row.entry.id;
    const c = categoryOf(row.entry.group);
    let op;
    try {
      op = await getOp(id);
    } catch (e) {
      return;
    }
    if (myToken !== detailToken) return;
    const usingInput = input.trim().length > 0;
    const sampleText = usingInput ? input.slice(0, PREVIEW_CHARS) : (op.examples?.[0]?.in?.[0] ?? '');
    const sampleParams = usingInput ? {} : op.examples?.[0]?.params || {};
    const fav = isFavorite(id);
    detail.style.setProperty('--hue', c.hue);
    detail.innerHTML = `
      <span class="detail-cat">${escapeHtml(c.label)}</span>
      <h3 class="detail-title">${escapeHtml(op.name)}</h3>
      <p class="detail-summary">${escapeHtml(op.summary || '')}</p>
      <div class="detail-preview">
        <div class="detail-preview-head">${usingInput ? 'Preview on your input' : 'Example'}${usingInput && input.length > PREVIEW_CHARS ? ' (first 4 KB)' : ''}${op.params?.length ? ' \u00b7 default settings' : ''}</div>
        <div class="detail-io"><pre class="detail-before" aria-label="Before"></pre><span class="detail-arrow" aria-hidden="true">\u2193</span><pre class="detail-after" aria-label="After">\u2026</pre></div>
      </div>
      <div class="detail-actions">
        <button type="button" class="btn btn-primary" data-act="add">Add step</button>
        <button type="button" class="btn" data-act="apply" ${usingInput ? '' : 'disabled'} title="Transform the input text directly, without adding a step">Apply to input</button>
        <button type="button" class="btn btn-ghost btn-icon detail-star${fav ? ' on' : ''}" data-act="star" aria-pressed="${fav}" aria-label="${fav ? 'Remove from' : 'Add to'} favorites">${fav ? '\u2605' : '\u2606'}</button>
      </div>
      ${op.params?.length ? `<p class="detail-note">${op.params.length} setting${op.params.length === 1 ? '' : 's'} \u2014 tweak them in the inspector after adding.</p>` : '<p class="detail-note">No settings needed.</p>'}`;
    const before = clip(sampleText);
    detail.querySelector('.detail-before').textContent = before.shown + (before.more ? `\n\u2026 ${before.more} more lines` : '') || '(empty)';
    detail.querySelector('[data-act="add"]').addEventListener('click', () => choose(row));
    detail.querySelector('[data-act="apply"]').addEventListener('click', () => choose(row, { apply: true }));
    detail.querySelector('[data-act="star"]').addEventListener('click', () => star(id));
    try {
      const { docs } = await previewOp(id, sampleText, sampleParams);
      if (myToken !== detailToken) return;
      const afterText = docs.length > 1 ? docs.map((d, i) => `\u2500\u2500 ${d.name || `doc ${i + 1}`} \u2500\u2500\n${d.text}`).join('\n') : docs[0]?.text ?? '';
      const after = clip(afterText);
      detail.querySelector('.detail-after').textContent = (after.shown + (after.more ? `\n\u2026 ${after.more} more lines` : '')) || '(empty)';
    } catch (e) {
      if (myToken !== detailToken) return;
      const el = detail.querySelector('.detail-after');
      el.textContent = e.message;
      el.classList.add('is-error');
    }
  }

  function star(id) {
    const on = toggleFavorite(id);
    toast(on ? 'Pinned to favorites & quick bar' : 'Removed from favorites');
    const keep = items[active]?._row;
    paintRail();
    if (activeCategory === 'favorites' && !search.value) paintList();
    else {
      list.querySelectorAll(`[data-op="${CSS.escape(id)}"] .item-star`).forEach((b) => {
        b.classList.toggle('on', on);
        b.textContent = on ? '\u2605' : '\u2606';
        b.setAttribute('aria-pressed', String(on));
      });
      if (keep) paintDetail(keep);
    }
  }

  async function choose(row, { apply = false, append = false } = {}) {
    if (row.kind === 'recipe') {
      close();
      await applyRecipe(store, engine, row.recipe, { replace: !append });
      return;
    }
    const id = row.entry.id;
    if (apply) {
      const bridge = getInputBridge();
      const text = bridge?.get() || '';
      if (!text.trim()) {
        toast('Paste some input first', 'error');
        return;
      }
      try {
        const { docs, op } = await previewOp(id, text);
        const before = text;
        bridge.set(docs.map((d) => d.text).join('\n\n'));
        pushRecent(id);
        close();
        toast(`Applied \u201C${op.name}\u201D to input`, 'ok', { action: 'Undo', onAction: () => bridge.set(before) });
      } catch (e) {
        toast(`Couldn\u2019t apply: ${e.message}`, 'error');
      }
      return;
    }
    close();
    await addStep(store, engine, id);
  }

  function cycleCategory(dir) {
    const ids = railEntries().filter((r) => !r.divider).map((r) => r.id);
    const i = ids.indexOf(activeCategory);
    activeCategory = ids[(i + dir + ids.length) % ids.length];
    search.value = '';
    paintRail();
    paintList();
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (search.value) {
        search.value = '';
        paintList();
      } else close();
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'PageDown') { e.preventDefault(); setActive(Math.min(items.length - 1, active + 8)); }
    else if (e.key === 'PageUp') { e.preventDefault(); setActive(Math.max(0, active - 8)); }
    else if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); cycleCategory(e.key === 'ArrowRight' ? 1 : -1); }
    else if (e.altKey && e.code === 'KeyS') {
      e.preventDefault();
      const row = items[active]?._row;
      if (row?.kind === 'op') star(row.entry.id);
    } else if (e.key === 'Enter' && items[active] && (e.target === search || list.contains(e.target))) {
      e.preventDefault();
      choose(items[active]._row, { apply: e.shiftKey });
    } else if (e.key === 'Tab') {
      const f = [...backdrop.querySelectorAll('button:not([disabled]), input')].filter((el) => el.offsetParent !== null && el.tabIndex !== -1);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  }

  function close() {
    if (!openInstance) return;
    openInstance = null;
    clearTimeout(detailTimer);
    detailToken++;
    document.removeEventListener('keydown', onKey, true);
    backdrop.classList.add('closing');
    backdrop.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    document.body.classList.remove('palette-open');
    setTimeout(() => backdrop.remove(), 140);
    if (previous?.focus && previous.isConnected) previous.focus();
  }

  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) close();
  });
  backdrop.querySelector('[data-close]').addEventListener('click', close);
  let searchTimer = null;
  search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(paintList, 40);
  });
  document.addEventListener('keydown', onKey, true);

  search.value = query;
  paintRail();
  paintList();
  requestAnimationFrame(() => search.focus());

  openInstance = { close, focusSearch: () => search.focus(), element: backdrop };
  return openInstance;
}
