export default {
  id: 'ws.stripTrailing',
  name: 'Strip trailing whitespace',
  group: 'Whitespace',
  summary: 'Remove trailing whitespace from the end of every line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Strip trailing whitespace per line';
  },
  run(docs) {
    return docs.map((d) => ({
      ...d,
      text: d.text
        .split(/\r\n|\r|\n/)
        .map((l) => l.replace(/[ \t]+$/, ''))
        .join('\n')
    }));
  },
  examples: [
    { params: {}, in: ['a   \nb\t'], out: ['a\nb'] },
    { params: {}, in: ['single  '], out: ['single'] }
  ]
};
