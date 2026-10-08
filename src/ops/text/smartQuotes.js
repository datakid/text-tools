const STRAIGHTEN = [
  [/[\u2018\u2019\u201A\u201B\u2032]/g, "'"],
  [/[\u201C\u201D\u201E\u201F\u2033]/g, '"'],
  [/[\u2013\u2014\u2212]/g, '-'],
  [/\u2026/g, '...'],
  [/[\u00A0\u2007\u202F]/g, ' ']
];

function curl(s) {
  return s
    .replace(/(^|[\s([{\u2014-])"/g, '$1\u201C')
    .replace(/"/g, '\u201D')
    .replace(/(^|[\s([{\u2014-])'/g, '$1\u2018')
    .replace(/'/g, '\u2019')
    .replace(/\.\.\./g, '\u2026')
    .replace(/ -- /g, ' \u2014 ');
}

export default {
  id: 'text.smartQuotes',
  name: 'Straighten / curl quotes',
  group: 'Text',
  summary: 'Turn typographic quotes, dashes, ellipses and non-breaking spaces into plain ASCII, or curl straight quotes.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Direction',
      default: 'straighten',
      options: [
        ['straighten', 'Straighten (to ASCII)'],
        ['curl', 'Curl (typographic)']
      ]
    }
  ],
  describe(p) {
    return p.mode === 'curl' ? 'Curl quotes' : 'Straighten quotes';
  },
  run(docs, p) {
    return docs.map((d) => {
      let text = d.text;
      if (p.mode === 'curl') text = curl(text);
      else for (const [re, rep] of STRAIGHTEN) text = text.replace(re, rep);
      return { ...d, text };
    });
  },
  examples: [
    { params: { mode: 'straighten' }, in: ['\u201CHi\u201D \u2014 it\u2019s\u2026'], out: ['"Hi" - it\'s...'] },
    { params: { mode: 'curl' }, in: ['"Hi" it\'s'], out: ['\u201CHi\u201D it\u2019s'] }
  ]
};
