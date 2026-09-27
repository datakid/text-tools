export default {
  id: 'extract.byRegex',
  name: 'Extract by pattern',
  group: 'Extract',
  summary: 'Extract every match of a regex as a row; capture groups become separated columns.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'pattern', type: 'regex', label: 'Pattern', default: '' },
    { key: 'separator', type: 'string', label: 'Column separator', default: '\t' }
  ],
  describe() {
    return 'Extract by pattern';
  },
  run(docs, p) {
    if (!p.pattern) return docs.map((d) => ({ ...d, text: '' }));
    const re = new RegExp(p.pattern, 'g');
    return docs.map((d) => {
      const rows = [];
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(d.text))) {
        const groups = m.slice(1);
        rows.push(groups.length ? groups.join(p.separator) : m[0]);
        if (m[0].length === 0) re.lastIndex += 1;
      }
      return { ...d, text: rows.join('\n') };
    });
  },
  examples: [
    { params: { pattern: '(\\w+)=(\\d+)', separator: '\t' }, in: ['a=1 b=22 c=3'], out: ['a\t1\nb\t22\nc\t3'] },
    { params: { pattern: 'xyz', separator: '\t' }, in: [''], out: [''] }
  ]
};
