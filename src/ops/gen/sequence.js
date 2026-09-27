export default {
  id: 'gen.sequence',
  name: 'Generate sequence',
  group: 'Gen',
  summary: 'Generate a numeric sequence as lines, from a start value by a step, for a count of lines.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'start', type: 'int', label: 'Start', default: 1 },
    { key: 'step', type: 'int', label: 'Step', default: 1 },
    { key: 'count', type: 'int', label: 'Count', default: 5, min: 0 },
    { key: 'template', type: 'template', label: 'Template', default: '{{n}}', tokens: ['{{n}}'] }
  ],
  describe(p) {
    return `Sequence: ${p.count} values from ${p.start}`;
  },
  run(docs, p) {
    const lines = [];
    for (let i = 0; i < p.count; i++) {
      lines.push(p.template.replace('{{n}}', String(p.start + i * p.step)));
    }
    const text = lines.join('\n');
    return docs.map((d) => ({ ...d, text }));
  },
  examples: [
    { params: { start: 1, step: 2, count: 4, template: '{{n}}' }, in: [''], out: ['1\n3\n5\n7'] },
    { params: { start: 1, step: 1, count: 0, template: '{{n}}' }, in: [''], out: [''] }
  ]
};
