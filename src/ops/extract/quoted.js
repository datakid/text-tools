import { extractAll } from './_shared.js';

const buildRegex = () => /"[^"]*"|'[^']*'/g;

export default {
  id: 'extract.quoted',
  name: 'Extract quoted strings',
  group: 'Extract',
  summary: 'Extract single- or double-quoted strings, one per line, quotes included.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Extract quoted strings';
  },
  run(docs) {
    return extractAll(docs, buildRegex);
  },
  examples: [
    { params: {}, in: ['she said "hello world" and \'goodbye\''], out: ['"hello world"\n\'goodbye\''] },
    { params: {}, in: ['no quotes'], out: [''] }
  ]
};
