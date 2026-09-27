import { shortId } from './id.js';
import { MANIFEST } from '../ops/index.js';

export function createWorkflow(name = 'Untitled workflow') {
  return {
    kind: 'sluice.workflow',
    version: 1,
    meta: { id: `wf_${shortId()}`, name, updated: Date.now() },
    params: [],
    steps: []
  };
}

export function createStep(opId, params = {}, note = '') {
  return { id: `s_${shortId()}`, op: opId, params, enabled: true, note };
}

export function serialize(workflow) {
  return JSON.stringify(workflow, null, 2);
}

export function migrate(wf) {
  if (!wf || typeof wf !== 'object' || wf.kind !== 'sluice.workflow') throw new Error('Not a Sluice workflow file');
  if (wf.version !== 1) throw new Error(`Unsupported workflow version: ${wf.version}`);
  if (!wf.meta || typeof wf.meta.id !== 'string' || typeof wf.meta.name !== 'string' || !wf.meta.name.trim()) {
    throw new Error('Workflow needs a valid name and id');
  }
  if (!Array.isArray(wf.steps) || wf.steps.length > 1000 || !wf.steps.every((step) =>
    step && typeof step.id === 'string' && MANIFEST.some((entry) => entry.id === step.op) &&
    step.params && typeof step.params === 'object' && !Array.isArray(step.params))) {
    throw new Error('Workflow has invalid steps');
  }
  if (wf.params != null && (!Array.isArray(wf.params) || wf.params.length > 100 || !wf.params.every((param) =>
    param && typeof param.key === 'string' && /^[a-zA-Z][\w]*$/.test(param.key)))) {
    throw new Error('Workflow has invalid parameters');
  }
  return { ...wf, params: wf.params || [] };
}

export function deserialize(json) {
  return migrate(JSON.parse(json));
}

export function resolveParams(stepParams, workflowParams, overrides = {}) {
  const scope = {};
  for (const p of workflowParams) scope[p.key] = overrides[p.key] ?? p.default;
  const resolved = {};
  for (const [key, value] of Object.entries(stepParams)) {
    if (typeof value === 'string' && value.startsWith('$') && scope[value.slice(1)] !== undefined) {
      resolved[key] = scope[value.slice(1)];
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

export function validateWorkflow(wf) {
  const errors = [];
  if (!wf.meta?.name) errors.push('Workflow needs a name');
  if (!Array.isArray(wf.steps)) errors.push('Workflow needs a steps array');
  return errors;
}
