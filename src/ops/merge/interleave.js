export default {
  id: 'merge.interleave',
  name: 'Interleave lines',
  group: 'Merge',
  summary: 'Interleave the lines of multiple documents round-robin into one document.',
  arity: 'merge',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Interleave lines round-robin';
  },
  run(docs) {
    if (docs.length === 0) return docs;
    const lineSets = docs.map((d) => d.text.split(/\r\n|\r|\n/));
    const maxLen = Math.max(...lineSets.map((l) => l.length));
    const out = [];
    for (let i = 0; i < maxLen; i++) {
      for (const lines of lineSets) {
        if (i < lines.length) out.push(lines[i]);
      }
    }
    return [{ id: 'merged', name: 'merged.txt', text: out.join('\n'), meta: {} }];
  },
  examples: [
    { params: {}, in: ['a\nb\nc', '1\n2\n3'], out: ['a\n1\nb\n2\nc\n3'] },
    { params: {}, in: ['solo'], out: ['solo'] }
  ]
};
