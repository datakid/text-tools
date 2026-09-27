const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'was', 'were', 'it', 'this', 'that'
]);

function tokenizeWords(text) {
  return text.match(/[A-Za-z0-9']+/g) || [];
}

export default {
  id: 'analyze.frequency',
  name: 'Word/char/n-gram frequency',
  group: 'Analyze',
  summary: 'Count word, character, or n-gram frequency, sorted by count descending.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'linear',
  params: [
    {
      key: 'unit',
      type: 'enum',
      label: 'Unit',
      default: 'word',
      options: [
        ['word', 'Word'],
        ['char', 'Character'],
        ['ngram', 'Word n-gram']
      ]
    },
    { key: 'n', type: 'int', label: 'N (n-gram size)', default: 2, min: 1, show: (p) => p.unit === 'ngram' },
    { key: 'minCount', type: 'int', label: 'Min count', default: 1, min: 1 },
    { key: 'stopwords', type: 'bool', label: 'Drop stopwords', default: false, show: (p) => p.unit !== 'char' },
    { key: 'caseInsensitive', type: 'bool', label: 'Case-insensitive', default: true, show: (p) => p.unit !== 'char' }
  ],
  describe(p) {
    return `Frequency: ${p.unit}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      let tokens;
      if (p.unit === 'char') {
        tokens = [...d.text].filter((c) => !/\s/.test(c));
      } else if (p.unit === 'ngram') {
        const words = tokenizeWords(p.caseInsensitive ? d.text.toLowerCase() : d.text);
        tokens = [];
        for (let i = 0; i + p.n <= words.length; i++) tokens.push(words.slice(i, i + p.n).join(' '));
      } else {
        let words = tokenizeWords(p.caseInsensitive ? d.text.toLowerCase() : d.text);
        if (p.stopwords) words = words.filter((w) => !STOPWORDS.has(w));
        tokens = words;
      }
      const counts = new Map();
      for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
      const rows = [...counts.entries()]
        .filter(([, c]) => c >= p.minCount)
        .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
      return { ...d, text: rows.map(([t, c]) => `${t}\t${c}`).join('\n') };
    });
  },
  examples: [
    {
      params: { unit: 'word', n: 2, minCount: 1, stopwords: false, caseInsensitive: true },
      in: ['the cat sat on the mat'],
      out: ['the\t2\ncat\t1\nmat\t1\non\t1\nsat\t1']
    },
    {
      params: { unit: 'word', n: 2, minCount: 1, stopwords: false, caseInsensitive: true },
      in: [''],
      out: ['']
    }
  ]
};
