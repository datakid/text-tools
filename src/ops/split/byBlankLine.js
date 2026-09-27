export default {
  id: 'split.byBlankLine',
  name: 'Split by blank line',
  group: 'Split',
  summary: 'Split a document into paragraphs wherever one or more blank lines occur.',
  arity: 'split',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    {
      key: 'name',
      type: 'template',
      label: 'Chunk name',
      default: '{{base}}-{{i:pad3}}',
      tokens: ['{{base}}', '{{i}}', '{{n}}']
    }
  ],
  describe() {
    return 'Split on blank lines';
  },
  run(docs, p) {
    const out = [];
    docs.forEach((d) => {
      const raw = d.text.split(/\r?\n\s*\r?\n+/).filter((s) => s.length > 0);
      const chunks = raw.length ? raw : [''];
      const n = chunks.length;
      chunks.forEach((text, i) => {
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
      params: { name: '{{base}}-{{i:pad3}}' },
      in: ['para one\nline two\n\npara two'],
      out: ['para one\nline two', 'para two']
    },
    { params: { name: '{{base}}-{{i:pad3}}' }, in: [''], out: [''] }
  ]
};
