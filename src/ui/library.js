import { openModal, promptDialog, confirmDialog } from './modal.js';
import * as persist from '../core/persist.js';
import { nanoid } from '../core/id.js';
import { escapeHtml } from './escape.js';

function relTime(ts) {
  if (!ts) return '';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export async function openLibrary(store, historyController) {
  const body = document.createElement('div');
  body.className = 'dialog-stack';
  body.innerHTML = '<div id="lib-list" class="dialog-list"></div>';
  const listEl = body.querySelector('#lib-list');

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-primary';
  saveBtn.id = 'lib-save-current';
  saveBtn.textContent = 'Save current workflow';

  const modal = openModal('Saved workflows', body, { subtitle: 'Stored locally in this browser.', footer: [saveBtn] });

  async function paint() {
    const rows = await persist.listWorkflows();
    const currentId = store.get().workflow.meta.id;
    listEl.innerHTML = '';
    if (rows.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><strong>No saved workflows yet</strong><span>Save the current pipeline to reuse it later.</span></div>';
      return;
    }
    for (const row of rows) {
      const wf = row.workflow;
      const steps = (wf.steps || []).length;
      const item = document.createElement('div');
      item.className = `list-row${wf.meta.id === currentId ? ' is-current' : ''}`;
      item.innerHTML = `
        <span class="list-avatar" aria-hidden="true">${escapeHtml((wf.meta.name || '?').trim().charAt(0).toUpperCase() || '?')}</span>
        <span class="list-main">
          <span class="list-title">${escapeHtml(wf.meta.name)}</span>
          <span class="list-meta">${steps} step${steps === 1 ? '' : 's'}${wf.meta.updated ? ` \u00b7 ${relTime(wf.meta.updated)}` : ''}${wf.meta.id === currentId ? ' \u00b7 open' : ''}</span>
        </span>
        <span class="list-actions">
          <button class="btn btn-ghost btn-icon" type="button" data-action="duplicate" title="Duplicate" aria-label="Duplicate">\u29C9</button>
          <button class="btn btn-ghost btn-icon" type="button" data-action="rename" title="Rename" aria-label="Rename">\u270E</button>
          <button class="btn btn-ghost btn-icon btn-icon-danger" type="button" data-action="delete" title="Delete" aria-label="Delete">\u2715</button>
          <button class="btn btn-soft" type="button" data-action="load">Open</button>
        </span>
      `;

      item.querySelector('[data-action="load"]').addEventListener('click', () => {
        historyController.resetTo(wf);
        store.set({ workflow: wf, selectedStepId: null });
        modal.close();
      });

      item.querySelector('[data-action="duplicate"]').addEventListener('click', async () => {
        const clone = { ...wf, meta: { ...wf.meta, id: `wf_${nanoid()}`, name: `${wf.meta.name} copy`, updated: Date.now() } };
        await persist.saveWorkflow(clone);
        paint();
      });

      item.querySelector('[data-action="rename"]').addEventListener('click', async () => {
        const name = await promptDialog('Rename workflow', { value: wf.meta.name, confirmText: 'Rename' });
        if (!name) return;
        const renamed = { ...wf, meta: { ...wf.meta, name, updated: Date.now() } };
        await persist.saveWorkflow(renamed);
        if (store.get().workflow.meta.id === renamed.meta.id) store.set({ workflow: renamed });
        paint();
      });

      item.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        const ok = await confirmDialog('Delete workflow?', { message: `\u201C${wf.meta.name}\u201D will be removed from this browser. This can\u2019t be undone.`, confirmText: 'Delete', danger: true });
        if (!ok) return;
        await persist.deleteWorkflow(wf.meta.id);
        paint();
      });

      listEl.appendChild(item);
    }
  }

  saveBtn.addEventListener('click', async () => {
    const current = store.get().workflow;
    const name = await promptDialog('Save workflow', { value: current.meta.name, confirmText: 'Save' });
    if (!name) return;
    const toSave = { ...current, meta: { ...current.meta, name, updated: Date.now() } };
    await persist.saveWorkflow(toSave);
    store.set({ workflow: toSave });
    paint();
  });

  paint();
}
