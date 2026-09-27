import { openModal } from './modal.js';
import * as persist from '../core/persist.js';
import { triggerRun } from './previewController.js';

function formatStats(stats) {
  if (!stats) return '';
  return `${stats.docs} docs \u00b7 ${stats.lines.toLocaleString()} lines \u00b7 ${stats.chars.toLocaleString()} chars`;
}

export async function openRunHistory(store, engine, historyController) {
  const body = document.createElement('div');
  body.innerHTML = '<div id="history-list" class="dialog-list"><div class="empty-state"><span>Loading\u2026</span></div></div>';
  const listEl = body.querySelector('#history-list');
  const modal = openModal('Run history', body, { subtitle: 'The 20 most recent runs of this workflow.' });

  const workflowId = store.get().workflow.meta.id;
  const runs = await persist.listRuns(workflowId, 20);
  listEl.innerHTML = '';

  if (runs.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><strong>No runs yet</strong><span>Run the pipeline once to start a history.</span></div>';
    return;
  }

  for (const run of runs) {
    const d = new Date(run.timestamp);
    const item = document.createElement('div');
    item.className = 'list-row';
    item.innerHTML = `
      <span class="list-avatar list-avatar-time" aria-hidden="true">${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <span class="list-main">
        <span class="list-title">${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        <span class="list-meta">${formatStats(run.stats)}</span>
      </span>
      <span class="list-actions">
        <button class="btn btn-soft" type="button" data-action="rerun">Re-run</button>
      </span>
    `;
    item.querySelector('[data-action="rerun"]').addEventListener('click', () => {
      historyController.resetTo(run.workflow);
      store.set({ workflow: run.workflow, selectedStepId: null });
      triggerRun(store, engine, run.overrides || {});
      modal.close();
    });
    listEl.appendChild(item);
  }
}
