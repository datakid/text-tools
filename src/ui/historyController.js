import { createHistory } from '../core/history.js';

export function wireHistory(store) {
  const history = createHistory(store.get().workflow);
  let restoring = false;

  store.subscribe((state, changed) => {
    if (restoring) return;
    if (changed.includes('workflow')) history.push(state.workflow);
  });

  function apply(workflow) {
    if (!workflow) return;
    restoring = true;
    store.set({ workflow, selectedStepId: null });
    restoring = false;
  }

  function undo() {
    apply(history.undo());
  }

  function redo() {
    apply(history.redo());
  }

  function resetTo(workflow) {
    history.reset(workflow);
  }

  window.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (document.body.classList.contains('modal-open')) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((key === 'z' && e.shiftKey) || key === 'y') {
      e.preventDefault();
      redo();
    }
  });

  return { undo, redo, resetTo, canUndo: history.canUndo, canRedo: history.canRedo };
}
