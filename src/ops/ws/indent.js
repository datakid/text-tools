export default {
  id: 'ws.indent',
  name: 'Indent lines',
  group: 'Whitespace',
  summary: 'Add a prefix to the start of every line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'prefix', type: 'string', label: 'Prefix', default: '  ' },
    { key: 'skipBlank', type: 'bool', label: 'Skip blank lines', default: true }
  ],
  describe(p) {
    return `Indent with "${p.prefix}"`;
  },
  run(docs, p) {
    return docs.map((d) => ({
      ...d,
      text: d.text
        .split(/\r\n|\r|\n/)
        .map((l) => (p.skipBlank && l.trim() === '' ? l : p.prefix + l))
        .join('\n')
    }));
  },
  examples: [
    { params: { prefix: '> ', skipBlank: true }, in: ['a\n\nb'], out: ['> a\n\n> b'] },
    { params: { prefix: '  ', skipBlank: true }, in: [''], out: [''] }
  ]
};
