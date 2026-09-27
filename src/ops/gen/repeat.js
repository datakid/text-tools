function fillTemplate(template, index) {
  const n = index + 1;
  return template
    .replace(/\{\{i:pad3\}\}/g, String(n).padStart(3, '0'))
    .replace(/\{\{i:hex\}\}/g, n.toString(16))
    .replace(/\{\{i\}\}/g, String(n))
    .replace(/\{\{date\}\}/g, new Date().toISOString().slice(0, 10));
}

export default {
  id: 'gen.repeat',
  name: 'Repeat template',
  group: 'Gen',
  summary: 'Repeat a template N times, each with an incrementing index and other generator tokens.',
  arity: 'split',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'template',
      type: 'template',
      label: 'Template',
      default: 'item-{{i:pad3}}',
      tokens: ['{{i}}', '{{i:pad3}}', '{{i:hex}}', '{{date}}']
    },
    { key: 'count', type: 'int', label: 'Count', default: 5, min: 0 }
  ],
  describe(p) {
    return `Repeat ${p.count} times`;
  },
  run(docs, p) {
    const out = [];
    for (let i = 0; i < p.count; i++) {
      const text = fillTemplate(p.template, i);
      out.push({ id: `gen-${i}`, name: text, text, meta: {} });
    }
    return out;
  },
  examples: [
    { params: { template: 'item-{{i:pad3}}', count: 3 }, in: [''], out: ['item-001', 'item-002', 'item-003'] },
    { params: { template: 'x', count: 0 }, in: [''], out: [] }
  ]
};
