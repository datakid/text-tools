export default {
  id: 'flow.select',
  name: 'Select documents',
  group: 'Flow',
  summary: 'Keep only the documents matching a name pattern, index range, or content check.',
  arity: 'split',
  previewFidelity: 'none',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Match by',
      default: 'namePattern',
      options: [
        ['namePattern', 'Name pattern'],
        ['indexRange', 'Index range'],
        ['contentContains', 'Content contains']
      ]
    },
    { key: 'pattern', type: 'regex', label: 'Name pattern', default: '', show: (p) => p.mode === 'namePattern' },
    { key: 'min', type: 'int', label: 'Min index', default: 0, min: 0, show: (p) => p.mode === 'indexRange' },
    { key: 'max', type: 'int', label: 'Max index', default: 0, min: 0, show: (p) => p.mode === 'indexRange' },
    { key: 'value', type: 'string', label: 'Text', default: '', show: (p) => p.mode === 'contentContains' }
  ],
  describe(p) {
    return `Select by ${p.mode}`;
  },
  run(docs, p) {
    if (p.mode === 'namePattern') {
      if (!p.pattern) return docs;
      let re;
      try {
        re = new RegExp(p.pattern);
      } catch (e) {
        return docs;
      }
      return docs.filter((d) => re.test(d.name));
    }
    if (p.mode === 'indexRange') return docs.filter((_, i) => i >= p.min && i <= p.max);
    if (p.mode === 'contentContains') return docs.filter((d) => d.text.includes(p.value));
    return docs;
  },
  examples: [
    {
      params: { mode: 'namePattern', pattern: '^doc_0$', min: 0, max: 0, value: '' },
      in: ['a', 'b'],
      out: ['a']
    },
    {
      params: { mode: 'contentContains', pattern: '', min: 0, max: 0, value: 'zzz' },
      in: ['a', 'b'],
      out: []
    }
  ]
};
