export default {
  id: 'data.jsonFormat',
  name: 'Format JSON',
  group: 'Data',
  summary: 'Pretty-print JSON with a chosen indent width.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'indent', type: 'int', label: 'Indent', default: 2, min: 0, max: 8 }],
  describe(p) {
    return `Format JSON (indent ${p.indent})`;
  },
  run(docs, p) {
    return docs.map((d) => {
      let text;
      try {
        text = JSON.stringify(JSON.parse(d.text), null, p.indent);
      } catch (e) {
        text = d.text;
      }
      return { ...d, text };
    });
  },
  examples: [
    { params: { indent: 2 }, in: ['{"a":1,"b":[1,2]}'], out: ['{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}'] },
    { params: { indent: 2 }, in: ['not json'], out: ['not json'] }
  ]
};
