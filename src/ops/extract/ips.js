import { extractAll } from './_shared.js';

const buildRegex = () => /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

export default {
  id: 'extract.ips',
  name: 'Extract IPv4 addresses',
  group: 'Extract',
  summary: 'Extract all IPv4-shaped addresses from the document, one per line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Extract IPv4 addresses';
  },
  run(docs) {
    return extractAll(docs, buildRegex);
  },
  examples: [
    { params: {}, in: ['server at 192.168.1.1 and 10.0.0.255'], out: ['192.168.1.1\n10.0.0.255'] },
    { params: {}, in: [''], out: [''] }
  ]
};
