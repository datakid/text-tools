export default {
  id: 'ws.removeBlank',
  name: 'Remove blank lines',
  group: 'Whitespace',
  summary: 'Remove lines that are empty or, optionally, whitespace-only.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'whitespaceOnly', type: 'bool', label: 'Also remove whitespace-only lines', default: true }],
  describe(p) {
    return p.whitespaceOnly ? 'Remove empty and whitespace-only lines' : 'Remove strictly empty lines';
  },
  run(docs, p) {
    const isBlank = (l) => (p.whitespaceOnly ? l.trim().length === 0 : l.length === 0);
    return docs.map((d) => ({
      ...d,
      text: d.text
        .split(/\r\n|\r|\n/)
        .filter((l) => !isBlank(l))
        .join('\n')
    }));
  },
  examples: [
    { params: { whitespaceOnly: true }, in: ['a\n\n  \nb'], out: ['a\nb'] },
    { params: { whitespaceOnly: true }, in: [''], out: [''] }
  ]
};
