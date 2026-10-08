export default {
  id: 'lines.sample',
  name: 'Random sample lines',
  group: 'Lines',
  summary: 'Pick N random lines (seeded and reproducible), optionally keeping their original order.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'linear',
  params: [
    { key: 'count', type: 'int', label: 'Lines to keep', default: 10, min: 0 },
    { key: 'seed', type: 'int', label: 'Seed', default: 1, min: 0 },
    { key: 'keepOrder', type: 'bool', label: 'Keep original order', default: true }
  ],
  describe(p) {
    return `Sample ${p.count} lines`;
  },
  run(docs, p, ctx) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const rand = ctx.rng(p.seed);
      const idx = lines.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [idx[i], idx[j]] = [idx[j], idx[i]];
      }
      const picked = idx.slice(0, Math.min(p.count, idx.length));
      if (p.keepOrder) picked.sort((a, b) => a - b);
      return { ...d, text: picked.map((i) => lines[i]).join('\n') };
    });
  },
  examples: [
    { params: { count: 10, seed: 1, keepOrder: true }, in: ['a\nb\nc'], out: ['a\nb\nc'] },
    { params: { count: 0, seed: 1, keepOrder: true }, in: ['a\nb'], out: [''] }
  ]
};
