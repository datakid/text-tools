import { extractAll } from './_shared.js';

const buildRegex = () => /#[A-Za-z0-9_]+/g;

export default {
  id: 'extract.hashtags',
  name: 'Extract hashtags',
  group: 'Extract',
  summary: 'Extract #hashtag tokens, one per line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Extract hashtags';
  },
  run(docs) {
    return extractAll(docs, buildRegex);
  },
  examples: [
    { params: {}, in: ['loving #sunsets and #Beach2026 today'], out: ['#sunsets\n#Beach2026'] },
    { params: {}, in: [''], out: [''] }
  ]
};
