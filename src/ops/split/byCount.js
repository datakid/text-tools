export default {
  id: 'split.byCount',
  name: 'Split into N parts',
  group: 'Split',
  summary: 'Split a document into exactly N roughly equal parts.',
  arity: 'split',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    { key: 'count', type: 'int', label: 'Parts', default: 2, min: 1 },
    {
      key: 'unit',
      type: 'enum',
      label: 'Measure in',
      default: 'lines',
      options: [
        ['lines', 'Lines'],
        ['chars', 'Characters']
      ]
    },
    {
      key: 'name',
      type: 'template',
      label: 'Chunk name',
      default: '{{base}}-{{i:pad3}}',
      tokens: ['{{base}}', '{{i}}', '{{n}}']
    }
  ],
  describe(p) {
    return `Split into ${p.count} parts`;
  },
  run(docs, p) {
    const out = [];
    docs.forEach((d) => {
      let parts;
      if (p.unit === 'lines') {
        const lines = d.text.split(/\r\n|\r|\n/);
        const per = Math.ceil(lines.length / p.count) || 1;
        parts = [];
        for (let i = 0; i < lines.length; i += per) parts.push(lines.slice(i, i + per).join('\n'));
      } else {
        const text = d.text;
        const per = Math.ceil(text.length / p.count) || 1;
        parts = [];
        for (let i = 0; i < text.length; i += per) parts.push(text.slice(i, i + per));
        if (parts.length === 0) parts = [''];
      }
      while (parts.length < p.count) parts.push('');

      const n = parts.length;
      parts.forEach((text, i) => {
        const name = p.name
          .replace('{{base}}', d.name)
          .replace('{{i:pad3}}', String(i + 1).padStart(3, '0'))
          .replace('{{i}}', String(i + 1))
          .replace('{{n}}', String(n));
        out.push({ id: `${d.id}-${i}`, name, text, meta: { ...d.meta, parent: d.id, chunkIndex: i } });
      });
    });
    return out;
  },
  examples: [
    {
      params: { count: 3, unit: 'lines', name: '{{base}}-{{i:pad3}}' },
      in: ['a\nb\nc\nd\ne\nf\ng'],
      out: ['a\nb\nc', 'd\ne\nf', 'g']
    },
    {
      params: { count: 2, unit: 'lines', name: '{{base}}-{{i:pad3}}' },
      in: ['solo'],
      out: ['solo', '']
    }
  ]
};
