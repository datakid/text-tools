function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = sortKeys(value[k]);
    return out;
  }
  return value;
}

export default {
  id: 'data.jsonSortKeys',
  name: 'Sort JSON keys',
  group: 'Data',
  summary: 'Recursively sort object keys alphabetically throughout a JSON document.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'indent', type: 'int', label: 'Indent', default: 2, min: 0, max: 8 }],
  describe() {
    return 'Sort JSON keys';
  },
  run(docs, p) {
    return docs.map((d) => {
      let text;
      try {
        text = JSON.stringify(sortKeys(JSON.parse(d.text)), null, p.indent);
      } catch (e) {
        text = d.text;
      }
      return { ...d, text };
    });
  },
  examples: [
    { params: { indent: 0 }, in: ['{"b":1,"a":2}'], out: ['{"a":2,"b":1}'] },
    { params: { indent: 0 }, in: ['[{"b":1,"a":2},{"d":1,"c":2}]'], out: ['[{"a":2,"b":1},{"c":2,"d":1}]'] }
  ]
};
