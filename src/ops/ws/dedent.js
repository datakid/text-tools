export default {
  id: 'ws.dedent',
  name: 'Dedent',
  group: 'Whitespace',
  summary: 'Detect the common leading whitespace across all non-blank lines and remove it from every line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Remove common leading indentation';
  },
  run(docs) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const nonBlank = lines.filter((l) => l.trim() !== '');
      let common = null;
      for (const line of nonBlank) {
        const leading = line.match(/^[ \t]*/)[0];
        common = common === null ? leading : commonPrefix(common, leading);
      }
      const cut = common || '';
      const out = lines.map((l) => (l.startsWith(cut) ? l.slice(cut.length) : l.replace(/^[ \t]*/, '')));
      return { ...d, text: out.join('\n') };
    });
  },
  examples: [
    { params: {}, in: ['    a\n    b\n      c'], out: ['a\nb\n  c'] },
    { params: {}, in: ['no indent'], out: ['no indent'] }
  ]
};

function commonPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return a.slice(0, i);
}
