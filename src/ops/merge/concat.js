export default {
  id: 'merge.concat',
  name: 'Concatenate',
  group: 'Merge',
  summary: 'Join all documents into one, with a separator and an optional per-document template.',
  arity: 'merge',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'template', type: 'template', label: 'Per-doc template', default: '{{text}}', tokens: ['{{name}}', '{{text}}', '{{i}}'] },
    { key: 'separator', type: 'template', label: 'Separator', default: '\n\n' }
  ],
  describe() {
    return 'Concatenate all documents';
  },
  run(docs, p) {
    if (docs.length === 0) return docs;
    const parts = docs.map((d, i) =>
      p.template.replace('{{name}}', d.name).replace('{{text}}', d.text).replace('{{i}}', String(i + 1))
    );
    return [{ id: 'merged', name: 'merged.txt', text: parts.join(p.separator), meta: {} }];
  },
  examples: [
    { params: { template: '{{text}}', separator: '\n\n' }, in: ['a', 'b'], out: ['a\n\nb'] },
    { params: { template: '## {{name}}\n{{text}}', separator: '\n\n' }, in: ['x'], out: ['## doc_0\nx'] }
  ]
};
