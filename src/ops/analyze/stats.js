export default {
  id: 'analyze.stats',
  name: 'Document stats',
  group: 'Analyze',
  summary: 'Report line, word, character, and byte counts per document, plus totals.',
  arity: 'reduce',
  previewFidelity: 'none',
  cost: 'linear',
  params: [],
  describe() {
    return 'Document stats';
  },
  run(docs) {
    const rows = docs.map((d) => ({
      name: d.name,
      lines: d.text.length ? d.text.split(/\r\n|\r|\n/).length : 0,
      words: (d.text.match(/\S+/g) || []).length,
      chars: d.text.length,
      bytes: new TextEncoder().encode(d.text).length
    }));
    const totals = rows.reduce(
      (acc, r) => ({
        lines: acc.lines + r.lines,
        words: acc.words + r.words,
        chars: acc.chars + r.chars,
        bytes: acc.bytes + r.bytes
      }),
      { lines: 0, words: 0, chars: 0, bytes: 0 }
    );
    const out = ['name\tlines\twords\tchars\tbytes'];
    for (const r of rows) out.push(`${r.name}\t${r.lines}\t${r.words}\t${r.chars}\t${r.bytes}`);
    out.push(`Total\t${totals.lines}\t${totals.words}\t${totals.chars}\t${totals.bytes}`);
    return [{ id: 'stats', name: 'stats.tsv', text: out.join('\n'), meta: {} }];
  },
  examples: [
    {
      params: {},
      in: ['hello world', 'foo'],
      out: ['name\tlines\twords\tchars\tbytes\ndoc_0\t1\t2\t11\t11\ndoc_1\t1\t1\t3\t3\nTotal\t2\t3\t14\t14']
    },
    { params: {}, in: [''], out: ['name\tlines\twords\tchars\tbytes\ndoc_0\t0\t0\t0\t0\nTotal\t0\t0\t0\t0'] }
  ]
};
