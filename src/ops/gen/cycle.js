export default {
  id: 'gen.cycle',
  name: 'Cycle values onto lines',
  group: 'Gen',
  summary: 'Prefix each line with the next value from a cycling list, wrapping around.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'list', type: 'template', label: 'Cycle values (one per line)', default: 'A\nB' },
    { key: 'template', type: 'template', label: 'Prefix template', default: '{{value}}: ', tokens: ['{{value}}'] }
  ],
  describe() {
    return 'Cycle values onto lines';
  },
  run(docs, p) {
    const values = p.list.split(/\r\n|\r|\n/).filter((l) => l !== '');
    if (values.length === 0) return docs;
    return docs.map((d) => {
      const lines = d.text
        .split(/\r\n|\r|\n/)
        .map((line, i) => p.template.replace('{{value}}', values[i % values.length]) + line);
      return { ...d, text: lines.join('\n') };
    });
  },
  examples: [
    { params: { list: 'A\nB', template: '{{value}}: ' }, in: ['x\ny\nz'], out: ['A: x\nB: y\nA: z'] },
    { params: { list: '', template: '{{value}}: ' }, in: ['unchanged'], out: ['unchanged'] }
  ]
};
