import { extractAll } from './_shared.js';

const buildRegex = () => /-?\d+(?:\.\d+)?/g;

export default {
  id: 'extract.numbers',
  name: 'Extract numbers',
  group: 'Extract',
  summary: 'Extract all integer and decimal numbers from the document, one per line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Extract numbers';
  },
  run(docs) {
    return extractAll(docs, buildRegex);
  },
  examples: [
    { params: {}, in: ['we have 42 apples and -3.5 oranges'], out: ['42\n-3.5'] },
    { params: {}, in: ['no numbers'], out: [''] }
  ]
};
