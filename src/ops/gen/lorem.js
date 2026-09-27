const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'
];

function words(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(LOREM_WORDS[i % LOREM_WORDS.length]);
  return out;
}

function sentence(wordCount) {
  const s = words(wordCount).join(' ');
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) + '.' : '';
}

function paragraph(sentenceCount) {
  const sentences = [];
  for (let i = 0; i < sentenceCount; i++) sentences.push(sentence(6 + (i % 5)));
  return sentences.join(' ');
}

export default {
  id: 'gen.lorem',
  name: 'Lorem ipsum',
  group: 'Gen',
  summary: 'Generate placeholder Lorem ipsum text by words, sentences, or paragraphs.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'unit',
      type: 'enum',
      label: 'Unit',
      default: 'words',
      options: [
        ['words', 'Words'],
        ['sentences', 'Sentences'],
        ['paragraphs', 'Paragraphs']
      ]
    },
    { key: 'count', type: 'int', label: 'Count', default: 20, min: 0 }
  ],
  describe(p) {
    return `${p.count} ${p.unit}`;
  },
  run(docs, p) {
    let text;
    if (p.unit === 'words') {
      text = words(p.count).join(' ');
    } else if (p.unit === 'sentences') {
      const s = [];
      for (let i = 0; i < p.count; i++) s.push(sentence(6 + (i % 5)));
      text = s.join(' ');
    } else {
      const paras = [];
      for (let i = 0; i < p.count; i++) paras.push(paragraph(4));
      text = paras.join('\n\n');
    }
    return docs.map((d) => ({ ...d, text }));
  },
  examples: [
    { params: { unit: 'words', count: 3 }, in: [''], out: ['lorem ipsum dolor'] },
    { params: { unit: 'words', count: 0 }, in: [''], out: [''] }
  ]
};
