export default {
  id: 'lines.shuffle',
  name: 'Shuffle lines',
  group: 'Lines',
  summary: 'Shuffle the lines of each document using a seeded, reproducible random order.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'linear',
  params: [{ key: 'seed', type: 'int', label: 'Seed', default: 1, min: 0 }],
  describe(p) {
    return `Shuffle (seed ${p.seed})`;
  },
  run(docs, p, ctx) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const rand = ctx.rng(p.seed);
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
      return { ...d, text: lines.join('\n') };
    });
  },
  examples: [
    { params: { seed: 1 }, in: ['a\nb\nc\nd'], out: ['d\nc\nb\na'] },
    { params: { seed: 1 }, in: ['solo'], out: ['solo'] }
  ]
};
