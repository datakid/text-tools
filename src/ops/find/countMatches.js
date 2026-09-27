export default {
  id: 'find.countMatches',
  name: 'Count matches',
  group: 'Find',
  summary: 'Report how many times a pattern matches in each document, as a single summary document.',
  arity: 'reduce',
  previewFidelity: 'none',
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
    { key: 'caseSensitive', type: 'bool', label: 'Case-sensitive', default: true }
  ],
  describe(p) {
    return `Count "${p.pattern}"`;
  },
  run(docs, p) {
    if (!p.pattern) return [{ id: 'counts', name: 'counts.txt', text: '', meta: {} }];
    const source = p.mode === 'regex' ? p.pattern : p.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(source, p.caseSensitive ? 'g' : 'gi');
    let total = 0;
    const rows = docs.map((d) => {
      const count = (d.text.match(re) || []).length;
      total += count;
      return `${d.name}\t${count}`;
    });
    rows.push(`Total\t${total}`);
    return [{ id: 'counts', name: 'counts.txt', text: rows.join('\n'), meta: {} }];
  },
  examples: [
    {
      params: { mode: 'literal', pattern: 'a', caseSensitive: true },
      in: ['banana', 'apple'],
      out: ['doc_0\t3\ndoc_1\t1\nTotal\t4']
    },
    {
      params: { mode: 'literal', pattern: 'a', caseSensitive: true },
      in: [''],
      out: ['doc_0\t0\nTotal\t0']
    }
  ]
};
