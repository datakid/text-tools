export default {
  id: 'split.byLines',
  name: 'Split by lines',
  group: 'Split',
  summary: 'Cut a document into chunks of N lines each.',
  arity: 'split',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    { key: 'count', type: 'int', label: 'Lines per chunk', default: 100, min: 1 },
    {
      key: 'name',
      type: 'template',
      label: 'Chunk name',
      default: '{{base}}-{{i:pad3}}',
      tokens: ['{{base}}', '{{i}}', '{{n}}']
    }
  ],
  describe(p) {
    return `Split every ${p.count} lines`;
  },
  run(docs, p, ctx) {
    const out = [];
    const total = docs.length || 1;

    docs.forEach((d, di) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const chunks = [];
      for (let i = 0; i < lines.length; i += p.count) {
        chunks.push(lines.slice(i, i + p.count).join('\n'));
      }
      const n = chunks.length;
      chunks.forEach((text, i) => {
        const name = p.name
          .replace('{{base}}', d.name)
          .replace('{{i:pad3}}', String(i + 1).padStart(3, '0'))
          .replace('{{i}}', String(i + 1))
          .replace('{{n}}', String(n));
        out.push({ id: `${d.id}-${i}`, name, text, meta: { ...d.meta, parent: d.id, chunkIndex: i } });
      });
      ctx?.progress?.((di + 1) / total);
    });

    return out;
  },
  examples: [
    {
      params: { count: 2, name: '{{base}}-{{i:pad3}}' },
      in: ['a\nb\nc\nd\ne'],
      out: ['a\nb', 'c\nd', 'e']
    },
    {
      params: { count: 100, name: '{{base}}-{{i:pad3}}' },
      in: ['solo'],
      out: ['solo']
    }
  ]
};
