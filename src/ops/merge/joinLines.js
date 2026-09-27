export default {
  id: 'merge.joinLines',
  name: 'Join lines',
  group: 'Merge',
  summary: 'Flatten every line of every document into a single line.',
  arity: 'merge',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'separator', type: 'string', label: 'Separator', default: ' ' }],
  describe(p) {
    return `Join all lines with "${p.separator}"`;
  },
  run(docs, p) {
    if (docs.length === 0) return docs;
    const allLines = docs.flatMap((d) => d.text.split(/\r\n|\r|\n/));
    return [{ id: 'merged', name: 'merged.txt', text: allLines.join(p.separator), meta: {} }];
  },
  examples: [
    { params: { separator: ' ' }, in: ['a\nb', 'c'], out: ['a b c'] },
    { params: { separator: ' ' }, in: [''], out: [''] }
  ]
};
