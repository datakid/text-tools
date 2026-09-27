export default {
  id: 'flow.sortDocs',
  name: 'Sort documents',
  group: 'Flow',
  summary: 'Reorder the documents in the set by name or by content length.',
  arity: 'split',
  previewFidelity: 'none',
  cost: 'nlogn',
  params: [
    {
      key: 'by',
      type: 'enum',
      label: 'Sort by',
      default: 'name',
      options: [
        ['name', 'Name'],
        ['length', 'Content length']
      ]
    },
    { key: 'reverse', type: 'bool', label: 'Reverse', default: false }
  ],
  describe(p) {
    return `Sort documents by ${p.by}`;
  },
  run(docs, p) {
    const sorted = [...docs].sort((a, b) => {
      const cmp = p.by === 'name' ? (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) : a.text.length - b.text.length;
      return p.reverse ? -cmp : cmp;
    });
    return sorted;
  },
  examples: [
    { params: { by: 'length', reverse: false }, in: ['ccc', 'a', 'bb'], out: ['a', 'bb', 'ccc'] },
    { params: { by: 'name', reverse: true }, in: ['a', 'b'], out: ['b', 'a'] }
  ]
};
