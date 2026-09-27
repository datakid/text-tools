function flatten(value, prefix, out) {
  if (value !== null && typeof value === 'object') {
    const keys = Array.isArray(value) ? value.map((_, i) => i) : Object.keys(value);
    if (keys.length === 0) {
      out.push([prefix || '$', Array.isArray(value) ? '[]' : '{}']);
      return;
    }
    for (const k of keys) {
      const nextPrefix = prefix ? (Array.isArray(value) ? `${prefix}[${k}]` : `${prefix}.${k}`) : String(k);
      flatten(value[k], nextPrefix, out);
    }
  } else {
    out.push([prefix, JSON.stringify(value)]);
  }
}

export default {
  id: 'data.jsonFlatten',
  name: 'Flatten JSON',
  group: 'Data',
  summary: 'Flatten nested JSON into dot/bracket-path key-value rows.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'separator', type: 'string', label: 'Separator', default: '\t' }],
  describe() {
    return 'Flatten JSON';
  },
  run(docs, p) {
    return docs.map((d) => {
      let text;
      try {
        const rows = [];
        flatten(JSON.parse(d.text), '', rows);
        text = rows.map(([k, v]) => `${k}${p.separator}${v}`).join('\n');
      } catch (e) {
        text = d.text;
      }
      return { ...d, text };
    });
  },
  examples: [
    { params: { separator: '\t' }, in: ['{"a":1,"b":{"c":2}}'], out: ['a\t1\nb.c\t2'] },
    { params: { separator: '\t' }, in: ['{}'], out: ['$\t{}'] }
  ]
};
