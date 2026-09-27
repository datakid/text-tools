function escapeForLiteral(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {
  id: 'find.replaceMany',
  name: 'Replace many (translation table)',
  group: 'Find',
  summary: 'Apply a table of find/replace pairs in sequence.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'pairs', type: 'pairs', label: 'Pairs', default: [] },
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
    { key: 'caseSensitive', type: 'bool', label: 'Case-sensitive', default: true }
  ],
  describe(p) {
    return `Replace ${p.pairs.length} pair${p.pairs.length === 1 ? '' : 's'}`;
  },
  run(docs, p) {
    if (!p.pairs.length) return docs;
    const flags = p.caseSensitive ? 'g' : 'gi';
    const compiled = p.pairs
      .filter((pair) => pair.find)
      .map((pair) => ({
        re: new RegExp(p.mode === 'regex' ? pair.find : escapeForLiteral(pair.find), flags),
        replace: pair.replace
      }));
    return docs.map((d) => {
      let text = d.text;
      for (const { re, replace } of compiled) text = text.replace(re, replace);
      return { ...d, text };
    });
  },
  examples: [
    {
      params: {
        pairs: [
          { find: 'cat', replace: 'dog' },
          { find: 'red', replace: 'blue' }
        ],
        mode: 'literal',
        caseSensitive: true
      },
      in: ['red cat, red dog'],
      out: ['blue dog, blue dog']
    },
    { params: { pairs: [], mode: 'literal', caseSensitive: true }, in: ['unchanged'], out: ['unchanged'] }
  ]
};
