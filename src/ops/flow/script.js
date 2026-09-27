import { OpError } from '../../core/result.js';
import { runUserScript } from '../../core/scriptRunner.js';

function runInSandboxWorker(code, docs, params, timeoutSeconds) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../../worker/sandbox.js', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new OpError('script-timeout', `Script timed out after ${timeoutSeconds}s`));
    }, timeoutSeconds * 1000);

    worker.onmessage = (e) => {
      clearTimeout(timer);
      worker.terminate();
      if (e.data.ok) resolve(e.data.docs);
      else reject(new OpError('script-error', e.data.error));
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      reject(new OpError('script-error', e.message));
    };
    worker.postMessage({ code, docs, params });
  });
}

export default {
  id: 'flow.script',
  name: 'Script',
  group: 'Flow',
  summary: 'Run a custom transform(docs, params) function against the DocSet, isolated in a Worker with no network access.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'linear',
  params: [
    {
      key: 'code',
      type: 'code',
      label: 'Script',
      default: 'function transform(docs, params) {\n  return docs;\n}',
      help: 'Define transform(docs, params) and return the new DocSet. No network access; params is currently always empty.'
    },
    { key: 'timeoutSeconds', type: 'int', label: 'Timeout (seconds)', default: 5, min: 1, max: 30 }
  ],
  describe() {
    return 'Run script';
  },
  async run(docs, p) {
    if (typeof Worker === 'undefined') {
      try {
        return runUserScript(p.code, docs, {});
      } catch (e) {
        throw new OpError('script-error', e.message);
      }
    }
    return runInSandboxWorker(p.code, docs, {}, p.timeoutSeconds);
  },
  examples: [
    {
      params: {
        code: 'function transform(docs) { return docs.map((d) => ({ ...d, text: d.text.toUpperCase() })); }',
        timeoutSeconds: 5
      },
      in: ['hello'],
      out: ['HELLO']
    },
    {
      params: { code: 'function transform(docs) { return docs.filter((d) => d.text.length > 2); }', timeoutSeconds: 5 },
      in: ['hi', 'hello'],
      out: ['hello']
    },
    {
      params: { code: 'function transform(docs) { return docs; }', timeoutSeconds: 5 },
      in: [''],
      out: ['']
    }
  ]
};
