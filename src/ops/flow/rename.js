export default {
  id: 'flow.rename',
  name: 'Rename documents',
  group: 'Flow',
  summary: 'Rename every document using a template.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'template',
      type: 'template',
      label: 'Name template',
      default: '{{name}}',
      tokens: ['{{name}}', '{{i}}', '{{i:pad3}}', '{{n}}']
    }
  ],
  describe() {
    return 'Rename documents';
  },
  run(docs, p) {
    const n = docs.length;
    return docs.map((d, i) => {
      const name = p.template
        .replace('{{name}}', d.name)
        .replace('{{i:pad3}}', String(i + 1).padStart(3, '0'))
        .replace('{{i}}', String(i + 1))
        .replace('{{n}}', String(n));
      return { ...d, name };
    });
  },
  examples: [
    { params: { template: 'file-{{i:pad3}}' }, in: ['a', 'b'], out: ['a', 'b'] },
    { params: { template: '{{name}}-v2' }, in: ['x'], out: ['x'] }
  ]
};
