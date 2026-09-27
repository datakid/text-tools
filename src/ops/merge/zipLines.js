export default {
  id: 'merge.zipLines',
  name: 'Zip lines',
  group: 'Merge',
  summary: 'Zip corresponding lines from multiple documents side by side.',
  arity: 'merge',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'separator', type: 'string', label: 'Separator', default: '\t' }],
  describe(p) {
    return `Zip lines with "${p.separator}"`;
  },
  run(docs, p) {
    if (docs.length === 0) return docs;
    const lineSets = docs.map((d) => d.text.split(/\r\n|\r|\n/));
    const maxLen = Math.max(...lineSets.map((l) => l.length));
    const out = [];
    for (let i = 0; i < maxLen; i++) {
      out.push(lineSets.map((lines) => (i < lines.length ? lines[i] : '')).join(p.separator));
    }
    return [{ id: 'merged', name: 'merged.txt', text: out.join('\n'), meta: {} }];
  },
  examples: [
    { params: { separator: ',' }, in: ['a\nb', '1\n2'], out: ['a,1\nb,2'] },
    { params: { separator: ',' }, in: ['solo'], out: ['solo'] }
  ]
};
