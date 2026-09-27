export default {
  id: 'text.truncate',
  name: 'Truncate',
  group: 'Text',
  summary: 'Truncate each line, or the whole document, to a maximum length with an optional ellipsis.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'scope',
      type: 'enum',
      label: 'Scope',
      default: 'perLine',
      options: [
        ['perLine', 'Each line'],
        ['wholeText', 'Whole document']
      ]
    },
    { key: 'maxLength', type: 'int', label: 'Max length', default: 80, min: 0 },
    { key: 'ellipsis', type: 'string', label: 'Ellipsis', default: '\u2026' }
  ],
  describe(p) {
    return `Truncate to ${p.maxLength} chars`;
  },
  run(docs, p) {
    const cut = (s) => {
      if (s.length <= p.maxLength) return s;
      const keep = Math.max(0, p.maxLength - p.ellipsis.length);
      return s.slice(0, keep) + p.ellipsis;
    };
    return docs.map((d) => ({
      ...d,
      text: p.scope === 'perLine' ? d.text.split(/\r\n|\r|\n/).map(cut).join('\n') : cut(d.text)
    }));
  },
  examples: [
    { params: { scope: 'perLine', maxLength: 5, ellipsis: '\u2026' }, in: ['hello world\nhi'], out: ['hell\u2026\nhi'] },
    { params: { scope: 'perLine', maxLength: 100, ellipsis: '\u2026' }, in: [''], out: [''] }
  ]
};
