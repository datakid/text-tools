export default {
  id: 'text.normalizeUnicode',
  name: 'Normalize Unicode',
  group: 'Text',
  summary: 'Apply a Unicode normalization form (NFC, NFD, NFKC, or NFKD).',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'form',
      type: 'enum',
      label: 'Form',
      default: 'NFC',
      options: [
        ['NFC', 'NFC (composed)'],
        ['NFD', 'NFD (decomposed)'],
        ['NFKC', 'NFKC (compatibility composed)'],
        ['NFKD', 'NFKD (compatibility decomposed)']
      ]
    }
  ],
  describe(p) {
    return `Normalize to ${p.form}`;
  },
  run(docs, p) {
    return docs.map((d) => ({ ...d, text: d.text.normalize(p.form) }));
  },
  examples: [
    { params: { form: 'NFC' }, in: ['e\u0301'], out: ['\u00e9'] },
    { params: { form: 'NFC' }, in: [''], out: [''] }
  ]
};
