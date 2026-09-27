import { serialize, deserialize } from '../core/workflow.js';

export function exportWorkflow(workflow) {
  const json = serialize(workflow);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workflow.meta.name.replace(/[^a-z0-9-_]+/gi, '-') || 'workflow'}.sluice.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function tryParseWorkflow(text) {
  try {
    return deserialize(text);
  } catch (e) {
    return null;
  }
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
