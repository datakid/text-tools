import { OpError } from '../../core/result.js';

export default {
  id: 'flow.assert',
  name: 'Assert',
  group: 'Flow',
  summary: 'Fail the run if a condition on the DocSet does not hold, so a saved workflow stays trustworthy on new input.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Condition',
      default: 'docCount',
      options: [
        ['docCount', 'Document count equals'],
        ['notEmpty', 'No document is empty'],
        ['contains', 'Every document contains']
      ]
    },
    { key: 'expectedCount', type: 'int', label: 'Expected count', default: 1, min: 0, show: (p) => p.mode === 'docCount' },
    { key: 'value', type: 'string', label: 'Text', default: '', show: (p) => p.mode === 'contains' }
  ],
  describe(p) {
    return `Assert: ${p.mode}`;
  },
  run(docs, p) {
    let ok = true;
    let message = '';
    if (p.mode === 'docCount') {
      ok = docs.length === p.expectedCount;
      message = `Expected ${p.expectedCount} docs, got ${docs.length}`;
    } else if (p.mode === 'notEmpty') {
      ok = docs.every((d) => d.text.trim() !== '');
      message = 'Found an empty document';
    } else if (p.mode === 'contains') {
      ok = docs.every((d) => d.text.includes(p.value));
      message = `Not every document contains "${p.value}"`;
    }
    if (!ok) throw new OpError('assert-failed', message);
    return docs;
  },
  examples: [
    { params: { mode: 'docCount', expectedCount: 2, value: '' }, in: ['a', 'b'], out: ['a', 'b'] },
    { params: { mode: 'docCount', expectedCount: 3, value: '' }, in: ['a', 'b'], out: ['__error__:Expected 3 docs, got 2'] }
  ]
};
