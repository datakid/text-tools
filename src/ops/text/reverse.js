function graphemeReverse(s) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return [...seg.segment(s)]
      .map((x) => x.segment)
      .reverse()
      .join('');
  }
  return [...s].reverse().join('');
}

export default {
  id: 'text.reverse',
  name: 'Reverse',
  group: 'Text',
  summary: 'Reverse the document by characters, words, or lines.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'unit',
      type: 'enum',
      label: 'Reverse by',
      default: 'chars',
      options: [
        ['chars', 'Characters'],
        ['words', 'Words'],
        ['lines', 'Lines']
      ]
    }
  ],
  describe(p) {
    return `Reverse by ${p.unit}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      let text;
      if (p.unit === 'chars') {
        text = graphemeReverse(d.text);
      } else if (p.unit === 'words') {
        text = d.text.split(/\s+/).filter(Boolean).reverse().join(' ');
      } else {
        text = d.text.split(/\r\n|\r|\n/).reverse().join('\n');
      }
      return { ...d, text };
    });
  },
  examples: [
    { params: { unit: 'chars' }, in: ['ab\ud83d\ude00cd'], out: ['dc\ud83d\ude00ba'] },
    { params: { unit: 'lines' }, in: ['a\nb\nc'], out: ['c\nb\na'] }
  ]
};
