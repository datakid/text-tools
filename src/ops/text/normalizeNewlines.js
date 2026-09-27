export default {
  id: 'text.normalizeNewlines',
  name: 'Normalize newlines',
  group: 'Text',
  summary: 'Convert every line ending in the document to a single chosen style.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'to',
      type: 'enum',
      label: 'Line ending',
      default: 'lf',
      options: [
        ['lf', 'LF (\\n)'],
        ['crlf', 'CRLF (\\r\\n)'],
        ['cr', 'CR (\\r)']
      ]
    }
  ],
  describe(p) {
    return `Normalize newlines to ${p.to.toUpperCase()}`;
  },
  run(docs, p) {
    const target = p.to === 'crlf' ? '\r\n' : p.to === 'cr' ? '\r' : '\n';
    return docs.map((d) => ({ ...d, text: d.text.split(/\r\n|\r|\n/).join(target) }));
  },
  examples: [
    { params: { to: 'crlf' }, in: ['a\nb\r\nc\rd'], out: ['a\r\nb\r\nc\r\nd'] },
    { params: { to: 'lf' }, in: [''], out: [''] }
  ]
};
