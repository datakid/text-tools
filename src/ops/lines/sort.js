function naturalCompare(a, b) {
  const re = /(\d+)|(\D+)/g;
  const ax = a.match(re) || [];
  const bx = b.match(re) || [];
  const len = Math.max(ax.length, bx.length);
  for (let i = 0; i < len; i++) {
    const av = ax[i] ?? '';
    const bv = bx[i] ?? '';
    const an = Number(av);
    const bn = Number(bv);
    if (av !== '' && bv !== '' && !Number.isNaN(an) && !Number.isNaN(bn)) {
      if (an !== bn) return an - bn;
    } else if (av !== bv) {
      return av < bv ? -1 : 1;
    }
  }
  return 0;
}

export default {
  id: 'lines.sort',
  name: 'Sort lines',
  group: 'Lines',
  summary: 'Sort the lines of each document lexically, naturally, numerically, or by length.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'nlogn',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Sort by',
      default: 'lexical',
      options: [
        ['lexical', 'Lexical (locale)'],
        ['natural', 'Natural'],
        ['numeric', 'Numeric'],
        ['length', 'Length']
      ]
    },
    { key: 'locale', type: 'string', label: 'Locale', default: 'en', show: (p) => p.mode === 'lexical' },
    { key: 'reverse', type: 'bool', label: 'Reverse', default: false },
    {
      key: 'caseInsensitive',
      type: 'bool',
      label: 'Case-insensitive',
      default: false,
      show: (p) => p.mode === 'lexical' || p.mode === 'natural'
    }
  ],
  describe(p) {
    return `Sort ${p.mode}${p.reverse ? ', reversed' : ''}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const collator = p.mode === 'lexical'
        ? new Intl.Collator(p.locale || 'en', { sensitivity: p.caseInsensitive ? 'base' : 'variant' })
        : null;
      const withIndex = lines.map((line, index) => ({ line, index }));
      withIndex.sort((a, b) => {
        let cmp;
        if (p.mode === 'lexical') {
          cmp = collator.compare(a.line, b.line);
        } else if (p.mode === 'natural') {
          const x = p.caseInsensitive ? a.line.toLowerCase() : a.line;
          const y = p.caseInsensitive ? b.line.toLowerCase() : b.line;
          cmp = naturalCompare(x, y);
        } else if (p.mode === 'numeric') {
          const an = parseFloat(a.line);
          const bn = parseFloat(b.line);
          const aBad = Number.isNaN(an);
          const bBad = Number.isNaN(bn);
          cmp = aBad && bBad ? 0 : aBad ? 1 : bBad ? -1 : an - bn;
        } else {
          cmp = a.line.length - b.line.length;
        }
        if (cmp === 0) cmp = a.index - b.index;
        return p.reverse ? -cmp : cmp;
      });
      return { ...d, text: withIndex.map((w) => w.line).join('\n') };
    });
  },
  examples: [
    {
      params: { mode: 'lexical', locale: 'en', reverse: false, caseInsensitive: false },
      in: ['banana\napple\ncherry'],
      out: ['apple\nbanana\ncherry']
    },
    {
      params: { mode: 'lexical', locale: 'en', reverse: false, caseInsensitive: false },
      in: ['solo'],
      out: ['solo']
    },
    {
      params: { mode: 'numeric', locale: 'en', reverse: false, caseInsensitive: false },
      in: ['10\nx\n2\ny\n-1'],
      out: ['-1\n2\n10\nx\ny']
    },
    {
      params: { mode: 'natural', locale: 'en', reverse: false, caseInsensitive: false },
      in: ['file10\nfile2\nfile1'],
      out: ['file1\nfile2\nfile10']
    }
  ]
};
