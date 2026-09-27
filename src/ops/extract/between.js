function escapeForLiteral(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {
  id: 'extract.between',
  name: 'Extract between delimiters',
  group: 'Extract',
  summary: 'Extract text found between a start and end delimiter.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'start', type: 'string', label: 'Start delimiter', default: '[' },
    { key: 'end', type: 'string', label: 'End delimiter', default: ']' },
    { key: 'greedy', type: 'bool', label: 'Greedy', default: false },
    { key: 'inclusive', type: 'bool', label: 'Include delimiters', default: false }
  ],
  describe() {
    return 'Extract between delimiters';
  },
  run(docs, p) {
    if (!p.start || !p.end) return docs.map((d) => ({ ...d, text: '' }));
    const body = p.greedy ? '[\\s\\S]*' : '[\\s\\S]*?';
    const re = new RegExp(`${escapeForLiteral(p.start)}(${body})${escapeForLiteral(p.end)}`, 'g');
    return docs.map((d) => {
      const rows = [];
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(d.text))) {
        rows.push(p.inclusive ? m[0] : m[1]);
        if (m[0].length === 0) re.lastIndex += 1;
      }
      return { ...d, text: rows.join('\n') };
    });
  },
  examples: [
    { params: { start: '[', end: ']', greedy: false, inclusive: false }, in: ['[a][b]'], out: ['a\nb'] },
    { params: { start: '[', end: ']', greedy: true, inclusive: false }, in: ['[a][b]'], out: ['a][b'] }
  ]
};
