export default {
  id: 'analyze.longestLines',
  name: 'Longest lines',
  group: 'Analyze',
  summary: 'List the longest lines in each document, with their lengths.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'nlogn',
  params: [{ key: 'count', type: 'int', label: 'Show top N', default: 10, min: 1 }],
  describe(p) {
    return `Top ${p.count} longest lines`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const ranked = d.text
        .split(/\r\n|\r|\n/)
        .map((line, i) => ({ line, len: line.length, i }))
        .sort((a, b) => b.len - a.len || a.i - b.i)
        .slice(0, p.count);
      return { ...d, text: ranked.map((r) => `${r.len}\t${r.line}`).join('\n') };
    });
  },
  examples: [
    { params: { count: 2 }, in: ['short\na much longer line\nmid length'], out: ['18\ta much longer line\n10\tmid length'] },
    { params: { count: 5 }, in: [''], out: ['0\t'] }
  ]
};
