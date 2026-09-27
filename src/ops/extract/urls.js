import { extractAll } from './_shared.js';

const buildRegex = () => /\bhttps?:\/\/[^\s<>"')\]]+/g;

export default {
  id: 'extract.urls',
  name: 'Extract URLs',
  group: 'Extract',
  summary: 'Extract all http(s) URLs from the document, one per line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Extract URLs';
  },
  run(docs) {
    return extractAll(docs, buildRegex);
  },
  examples: [
    { params: {}, in: ['see https://example.com/page?x=1 and www.notmatched.com'], out: ['https://example.com/page?x=1'] },
    { params: {}, in: ['no links here'], out: [''] }
  ]
};
