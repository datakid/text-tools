export default {
  id: 'data.jsonMinify',
  name: 'Minify JSON',
  group: 'Data',
  summary: 'Compact JSON to a single line with no extra whitespace.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Minify JSON';
  },
  run(docs) {
    return docs.map((d) => {
      let text;
      try {
        text = JSON.stringify(JSON.parse(d.text));
      } catch (e) {
        text = d.text;
      }
      return { ...d, text };
    });
  },
  examples: [
    { params: {}, in: ['{\n  "a": 1,\n  "b": 2\n}'], out: ['{"a":1,"b":2}'] },
    { params: {}, in: [''], out: [''] }
  ]
};
