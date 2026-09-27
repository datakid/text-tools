export default {
  id: 'text.stripDiacritics',
  name: 'Strip diacritics',
  group: 'Text',
  summary: 'Remove accents and other combining marks, e.g. caf\u00e9 \u2192 cafe.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Strip diacritics';
  },
  run(docs) {
    return docs.map((d) => ({ ...d, text: d.text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') }));
  },
  examples: [
    { params: {}, in: ['caf\u00e9 na\u00efve r\u00e9sum\u00e9'], out: ['cafe naive resume'] },
    { params: {}, in: [''], out: [''] }
  ]
};
