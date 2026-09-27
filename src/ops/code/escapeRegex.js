function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unescape(s) {
  return s.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
}

export default {
  id: 'code.escapeRegex',
  name: 'Escape/unescape regex',
  group: 'Code',
  summary: 'Escape text so it is safe to use as a literal inside a regular expression, or reverse it.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Direction',
      default: 'encode',
      options: [
        ['encode', 'Encode'],
        ['decode', 'Decode']
      ]
    }
  ],
  describe(p) {
    return `Regex ${p.mode}`;
  },
  run(docs, p) {
    const fn = p.mode === 'encode' ? escape : unescape;
    return docs.map((d) => ({ ...d, text: fn(d.text) }));
  },
  examples: [
    { params: { mode: 'encode' }, in: ['1.5 (approx)'], out: ['1\\.5 \\(approx\\)'] },
    { params: { mode: 'decode' }, in: ['1\\.5 \\(approx\\)'], out: ['1.5 (approx)'] }
  ]
};
