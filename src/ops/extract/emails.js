import { extractAll } from './_shared.js';

const buildRegex = () => /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export default {
  id: 'extract.emails',
  name: 'Extract emails',
  group: 'Extract',
  summary: 'Extract all email-like addresses from the document, one per line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Extract emails';
  },
  run(docs) {
    return extractAll(docs, buildRegex);
  },
  examples: [
    { params: {}, in: ['contact me at a@b.com or c@d.org, thanks'], out: ['a@b.com\nc@d.org'] },
    { params: {}, in: [''], out: [''] }
  ]
};
