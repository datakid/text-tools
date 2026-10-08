import { createStep } from '../core/workflow.js';
import { get as getOp, findManifest } from '../core/registry.js';
import { defaults } from '../core/schema.js';
import { pushRecent } from '../core/prefs.js';
import { triggerPreview } from './previewController.js';
import { toast } from './toast.js';

let inputBridge = null;

export function registerInput(bridge) {
  inputBridge = bridge;
}

export function getInputBridge() {
  return inputBridge;
}

export async function addStep(store, engine, opId, params = {}, { select = true, silent = false } = {}) {
  const op = await getOp(opId);
  const wf = store.get().workflow;
  const step = createStep(opId, { ...defaults(op.params), ...params });
  const steps = [...wf.steps];
  const selectedIndex = steps.findIndex((s) => s.id === store.get().selectedStepId);
  steps.splice(selectedIndex >= 0 ? selectedIndex + 1 : steps.length, 0, step);
  store.set({ workflow: { ...wf, steps }, selectedStepId: select ? step.id : store.get().selectedStepId });
  pushRecent(opId);
  triggerPreview(store, engine);
  if (!silent) toast(`Added \u201C${findManifest(opId)?.name || op.name}\u201D`);
  return step;
}

export async function applyRecipe(store, engine, recipe, { replace = true } = {}) {
  const wf = store.get().workflow;
  const created = [];
  for (const [opId, params] of recipe.steps) {
    const op = await getOp(opId);
    created.push(createStep(opId, { ...defaults(op.params), ...params }));
  }
  const steps = replace ? created : [...wf.steps, ...created];
  store.set({ workflow: { ...wf, steps, meta: replace ? { ...wf.meta, name: recipe.name, updated: Date.now() } : wf.meta }, selectedStepId: created[0]?.id || null });
  if (recipe.sample && inputBridge && !inputBridge.get().trim()) inputBridge.set(recipe.sample);
  triggerPreview(store, engine);
  toast(`Loaded recipe \u201C${recipe.name}\u201D`);
}

export async function fullOutputText(store, engine) {
  const state = store.get();
  if (!state.docSetKey) return null;
  let key = state.previewMode === false ? state.runDocSetKey : state.previewExact ? state.previewDocSetKey : null;
  if (!key) {
    const result = await engine.run(state.docSetKey, state.workflow.steps, state.workflow.params, {}).promise;
    if (result.errors?.length) throw new Error(result.errors[0].message);
    key = result.docSetKey;
  }
  const { text } = await engine.exportDocs(key, 'clip');
  return text;
}

export async function bakeOutput(store, engine) {
  if (!inputBridge) return;
  const before = inputBridge.get();
  const wf = store.get().workflow;
  if (!wf.steps.some((s) => s.enabled)) {
    toast('Nothing to apply \u2014 add a step first', 'error');
    return;
  }
  const text = await fullOutputText(store, engine);
  if (text == null) return;
  const prevSteps = wf.steps;
  inputBridge.set(text);
  store.set({ workflow: { ...store.get().workflow, steps: [] }, selectedStepId: null });
  toast('Output moved to input \u2014 steps cleared', 'ok', {
    action: 'Undo',
    onAction: () => {
      inputBridge.set(before);
      store.set({ workflow: { ...store.get().workflow, steps: prevSteps } });
      triggerPreview(store, engine);
    }
  });
}
