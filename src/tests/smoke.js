import { createEngine } from '../core/engine.js';
import { createWorkflow, createStep, deserialize } from '../core/workflow.js';

const status = document.getElementById('result');
const engine = createEngine(new URL('../worker/run.worker.js', import.meta.url));
try {
  const workflow = createWorkflow('Smoke test');
  workflow.steps.push(createStep('text.case', { mode: 'upper' }));
  const restored = deserialize(JSON.stringify(workflow));
  if (restored.steps.length !== 1) throw new Error('Workflow round-trip failed');
  const { docSetKey } = await engine.ingest([{ name: 'sample.txt', text: 'hello world' }]);
  const output = await engine.run(docSetKey, workflow.steps, workflow.params, {}).promise;
  if (output.errors.length) throw new Error(JSON.stringify(output.errors));
  const windowResult = await engine.window(output.docSetKey, 0, 0, 1);
  if (windowResult.lines[0] !== 'HELLO WORLD') throw new Error(`Unexpected output: ${windowResult.lines[0]}`);
  status.textContent = 'PASS: workflow import, worker ingest, full run, output viewer';
  status.dataset.result = 'pass';
  console.log(status.textContent);
} catch (error) {
  status.textContent = `FAIL: ${error.stack || error.message}`;
  status.dataset.result = 'fail';
  console.error(error);
} finally {
  engine.terminate();
}
