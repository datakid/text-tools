import { openModal } from './modal.js';
import { buildShareUrl, shareTokenFromHash, decodeShare, MAX_INPUT_CHARS } from '../core/share.js';
import { getInputBridge } from './actions.js';
import { toast } from './toast.js';
import { triggerPreview } from './previewController.js';

export function openShareDialog(store) {
  const wf = store.get().workflow;
  const body = document.createElement('div');
  body.className = 'share-body';
  body.innerHTML = `
    <div class="field">
      <label for="share-url">Link</label>
      <div class="share-row">
        <input id="share-url" type="text" readonly spellcheck="false" value="Building link…">
        <button type="button" class="btn btn-primary" id="share-copy" disabled>Copy</button>
      </div>
      <div class="field-help" id="share-meta"></div>
    </div>
    <label class="share-check"><input type="checkbox" id="share-input"> Include the current input text <span class="field-help">(first ${MAX_INPUT_CHARS.toLocaleString()} characters)</span></label>
    <p class="modal-message share-note">The whole pipeline lives inside the link itself \u2014 nothing is uploaded. Anyone who opens it gets their own editable copy.</p>`;
  const urlEl = body.querySelector('#share-url');
  const copyBtn = body.querySelector('#share-copy');
  const meta = body.querySelector('#share-meta');
  const includeInput = body.querySelector('#share-input');
  const hasInput = Boolean(getInputBridge()?.get());
  includeInput.disabled = !hasInput;

  async function build() {
    copyBtn.disabled = true;
    const input = includeInput.checked ? getInputBridge()?.get() : null;
    const url = await buildShareUrl(wf, input);
    urlEl.value = url;
    copyBtn.disabled = false;
    const n = wf.steps.length;
    meta.textContent = `${n} step${n === 1 ? '' : 's'} \u00b7 ${url.length.toLocaleString()} characters${url.length > 8000 ? ' \u2014 long links may be cut off by some chat apps' : ''}`;
  }

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(urlEl.value);
      toast('Share link copied');
    } catch {
      urlEl.select();
      toast('Press Ctrl/\u2318+C to copy', 'error');
    }
  });
  urlEl.addEventListener('focus', () => urlEl.select());
  includeInput.addEventListener('change', build);

  openModal('Share workflow', body, { subtitle: wf.steps.length ? `\u201C${wf.meta.name}\u201D` : 'This workflow has no steps yet.' });
  build();
}

export async function loadSharedFromHash(store, engine, historyController) {
  const token = shareTokenFromHash();
  if (!token) return false;
  history.replaceState(null, '', location.pathname + location.search);
  try {
    const { workflow, input } = await decodeShare(token);
    const prev = store.get().workflow;
    const bridge = getInputBridge();
    const prevInput = bridge?.get() ?? '';
    historyController.resetTo(workflow);
    store.set({ workflow, selectedStepId: null });
    if (input != null && bridge) bridge.set(input);
    triggerPreview(store, engine);
    toast(`Opened shared workflow \u201C${workflow.meta.name}\u201D`, 'ok', {
      action: 'Undo',
      onAction: () => {
        historyController.resetTo(prev);
        store.set({ workflow: prev, selectedStepId: null });
        if (input != null && bridge) bridge.set(prevInput);
      }
    });
    return true;
  } catch (e) {
    toast(`Couldn\u2019t open share link: ${e.message}`, 'error');
    return false;
  }
}
