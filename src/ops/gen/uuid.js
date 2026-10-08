function hex(rand, n) {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(rand() * 16).toString(16);
  return s;
}

function cryptoRand() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
}

export default {
  id: 'gen.uuid',
  name: 'Generate UUIDs',
  group: 'Gen',
  summary: 'Generate random v4 UUIDs, one per line. Use a seed above 0 for reproducible output.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'count', type: 'int', label: 'How many', default: 5, min: 0, max: 100000 },
    { key: 'uppercase', type: 'bool', label: 'Uppercase', default: false },
    { key: 'seed', type: 'int', label: 'Seed (0 = truly random)', default: 0, min: 0 }
  ],
  describe(p) {
    return `Generate ${p.count} UUIDs`;
  },
  run(docs, p, ctx) {
    const rand = p.seed > 0 ? ctx.rng(p.seed) : cryptoRand;
    const lines = [];
    for (let i = 0; i < p.count; i++) {
      const variant = '89ab'[Math.floor(rand() * 4)];
      const id = `${hex(rand, 8)}-${hex(rand, 4)}-4${hex(rand, 3)}-${variant}${hex(rand, 3)}-${hex(rand, 12)}`;
      lines.push(p.uppercase ? id.toUpperCase() : id);
    }
    const text = lines.join('\n');
    return (docs.length ? docs : [{ id: 'gen', name: 'uuids.txt', meta: {} }]).map((d) => ({ ...d, text }));
  },
  examples: [
    { params: { count: 0, uppercase: false, seed: 1 }, in: ['x'], out: [''] }
  ]
};
