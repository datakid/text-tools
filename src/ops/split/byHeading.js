export default {
  id: 'split.byHeading',
  name: 'Split by heading',
  group: 'Split',
  summary: 'Split a Markdown document at every heading of a given level.',
  arity: 'split',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    { key: 'level', type: 'int', label: 'Heading level (#)', default: 2, min: 1, max: 6 },
    {
      key: 'name',
      type: 'template',
      label: 'Chunk name',
      default: '{{base}}-{{i:pad3}}',
      tokens: ['{{base}}', '{{i}}', '{{n}}']
    }
  ],
  describe(p) {
    return `Split at H${p.level} headings`;
  },
  run(docs, p) {
    const out = [];
    const marker = '#'.repeat(p.level);
    const re = new RegExp(`^${marker} .*$`, 'gm');

    docs.forEach((d) => {
      const boundaries = [...d.text.matchAll(re)].map((m) => m.index);
      const parts = [];

      if (boundaries.length === 0 || boundaries[0] > 0) {
        const end = boundaries.length ? boundaries[0] : d.text.length;
        const lead = d.text.slice(0, end);
        if (lead.trim() !== '') parts.push(lead);
      }
      for (let i = 0; i < boundaries.length; i++) {
        const start = boundaries[i];
        const end = i + 1 < boundaries.length ? boundaries[i + 1] : d.text.length;
        parts.push(d.text.slice(start, end));
      }

      const chunks = (parts.length ? parts : [d.text]).map((c) => c.replace(/\n+$/, ''));
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
      params: { level: 2, name: '{{base}}-{{i:pad3}}' },
      in: ['intro\n\n## A\nbody a\n\n## B\nbody b'],
      out: ['intro', '## A\nbody a', '## B\nbody b']
    },
    {
      params: { level: 2, name: '{{base}}-{{i:pad3}}' },
      in: ['no headings here'],
      out: ['no headings here']
    }
  ]
};
