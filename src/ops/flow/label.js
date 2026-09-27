export default {
  id: 'flow.label',
  name: 'Label documents',
  group: 'Flow',
  summary: 'Attach a metadata label to each document from a template, without changing its text.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'label', type: 'template', label: 'Label template', default: '{{name}}', tokens: ['{{name}}', '{{i}}', '{{n}}'] }
  ],
  describe() {
    return 'Label documents';
  },
  run(docs, p) {
    const n = docs.length;
    return docs.map((d, i) => {
      const label = p.label.replace('{{name}}', d.name).replace('{{i}}', String(i + 1)).replace('{{n}}', String(n));
      return { ...d, meta: { ...d.meta, label } };
    });
  },
  examples: [
    { params: { label: 'batch-{{i}}' }, in: ['a', 'b'], out: ['a', 'b'] },
    { params: { label: 'x' }, in: [''], out: [''] }
  ]
};
