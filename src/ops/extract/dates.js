import { extractAll } from './_shared.js';

const buildRegex = () => /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g;

export default {
  id: 'extract.dates',
  name: 'Extract dates',
  group: 'Extract',
  summary: 'Extract ISO (YYYY-MM-DD) and slash-style (M/D/YYYY) dates, one per line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Extract dates';
  },
  run(docs) {
    return extractAll(docs, buildRegex);
  },
  examples: [
    { params: {}, in: ['meet on 2026-09-23 or 9/23/2026'], out: ['2026-09-23\n9/23/2026'] },
    { params: {}, in: [''], out: [''] }
  ]
};
