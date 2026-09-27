export default {
  id: 'lines.slice',
  name: 'Slice lines',
  group: 'Lines',
  summary: 'Keep the head, tail, an index range, or every Nth line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Mode',
      default: 'head',
      options: [
        ['head', 'Head'],
        ['tail', 'Tail'],
        ['range', 'Range'],
        ['everyNth', 'Every Nth']
      ]
    },
    { key: 'count', type: 'int', label: 'Count', default: 10, min: 0, show: (p) => p.mode === 'head' || p.mode === 'tail' },
    { key: 'from', type: 'int', label: 'From', default: 0, min: 0, show: (p) => p.mode === 'range' },
    { key: 'to', type: 'int', label: 'To', default: 10, min: 0, show: (p) => p.mode === 'range' },
    { key: 'n', type: 'int', label: 'N', default: 2, min: 1, show: (p) => p.mode === 'everyNth' }
  ],
  describe(p) {
    return `Slice: ${p.mode}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      let out;
      if (p.mode === 'head') out = lines.slice(0, p.count);
      else if (p.mode === 'tail') out = lines.slice(Math.max(0, lines.length - p.count));
      else if (p.mode === 'range') out = lines.slice(p.from, p.to + 1);
      else out = lines.filter((_, i) => i % p.n === 0);
      return { ...d, text: out.join('\n') };
    });
  },
  examples: [
    { params: { mode: 'head', count: 2, from: 0, to: 10, n: 2 }, in: ['a\nb\nc\nd'], out: ['a\nb'] },
    { params: { mode: 'tail', count: 2, from: 0, to: 10, n: 2 }, in: ['x'], out: ['x'] }
  ]
};
