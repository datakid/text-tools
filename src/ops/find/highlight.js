export default {
  id: 'find.highlight',
  name: 'Highlight matches',
  group: 'Find',
  summary: 'Wrap matches of a literal or regex pattern in marker text.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Match',
      default: 'literal',
      options: [
        ['literal', 'Literal'],
        ['regex', 'Regular expression']
      ]
    },
    { key: 'pattern', type: 'string', label: 'Pattern', default: '' },
    { key: 'markerStart', type: 'string', label: 'Marker start', default: '**' },
    { key: 'markerEnd', type: 'string', label: 'Marker end', default: '**' },
    { key: 'caseSensitive', type: 'bool', label: 'Case-sensitive', default: true }
  ],
  describe(p) {
    return `Highlight "${p.pattern}"`;
  },
  run(docs, p) {
    if (!p.pattern) return docs;
    const source = p.mode === 'regex' ? p.pattern : p.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(source, p.caseSensitive ? 'g' : 'gi');
    return docs.map((d) => ({ ...d, text: d.text.replace(re, (m) => `${p.markerStart}${m}${p.markerEnd}`) }));
  },
  examples: [
    {
      params: { mode: 'literal', pattern: 'cat', markerStart: '**', markerEnd: '**', caseSensitive: true },
      in: ['a cat sat'],
      out: ['a **cat** sat']
    },
    {
      params: { mode: 'literal', pattern: 'cats', markerStart: '**', markerEnd: '**', caseSensitive: true },
      in: ['I \ud83d\ude00 cats'],
      out: ['I \ud83d\ude00 **cats**']
    }
  ]
};
