export default {
  id: 'gen.fromList',
  name: 'Generate from list',
  group: 'Gen',
  summary: 'Expand a template once per line of a pasted list.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'list', type: 'template', label: 'List (one per line)', default: '' },
    { key: 'template', type: 'template', label: 'Template', default: '{{item}}', tokens: ['{{item}}', '{{i}}', '{{n}}'] }
  ],
  describe() {
    return 'Generate from list';
  },
  run(docs, p) {
    const items = p.list.split(/\r\n|\r|\n/).filter((l) => l !== '');
    const n = items.length;
    const lines = items.map((item, i) =>
      p.template.replace('{{item}}', item).replace('{{i}}', String(i + 1)).replace('{{n}}', String(n))
    );
    const text = lines.join('\n');
    return docs.map((d) => ({ ...d, text }));
  },
  examples: [
    { params: { list: 'apple\nbanana\ncherry', template: '- {{item}}' }, in: [''], out: ['- apple\n- banana\n- cherry'] },
    { params: { list: '', template: '- {{item}}' }, in: [''], out: [''] }
  ]
};
