export default {
  id: 'flow.group',
  name: 'Group into batches',
  group: 'Flow',
  summary: 'Group consecutive documents into batches of N, concatenating each batch into one document.',
  arity: 'merge',
  previewFidelity: 'none',
  cost: 'linear',
  params: [
    { key: 'batchSize', type: 'int', label: 'Batch size', default: 5, min: 1 },
    { key: 'separator', type: 'template', label: 'Separator', default: '\n\n' }
  ],
  describe(p) {
    return `Group into batches of ${p.batchSize}`;
  },
  run(docs, p) {
    const out = [];
    for (let i = 0; i < docs.length; i += p.batchSize) {
      const batch = docs.slice(i, i + p.batchSize);
      const text = batch.map((d) => d.text).join(p.separator);
      out.push({ id: `group-${out.length}`, name: `group-${String(out.length + 1).padStart(3, '0')}`, text, meta: {} });
    }
    return out;
  },
  examples: [
    { params: { batchSize: 2, separator: '\n\n' }, in: ['a', 'b', 'c'], out: ['a\n\nb', 'c'] },
    { params: { batchSize: 5, separator: '\n\n' }, in: ['solo'], out: ['solo'] }
  ]
};
