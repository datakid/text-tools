import { escapeDelimitedField } from './_shared.js';

export default {
  id: 'data.jsonToCsv',
  name: 'JSON to CSV',
  group: 'Data',
  summary: 'Convert a JSON array of flat objects into a delimited table with a header row.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'delimiter', type: 'string', label: 'Delimiter', default: ',' }],
  describe() {
    return 'JSON to CSV';
  },
  run(docs, p) {
    return docs.map((d) => {
      let text;
      try {
        const data = JSON.parse(d.text);
        const rows = Array.isArray(data) ? data : [data];
        const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
        const lines = [keys.join(p.delimiter)];
        for (const r of rows) lines.push(keys.map((k) => escapeDelimitedField(r[k], p.delimiter)).join(p.delimiter));
        text = lines.join('\n');
      } catch (e) {
        text = d.text;
      }
      return { ...d, text };
    });
  },
  examples: [
    { params: { delimiter: ',' }, in: ['[{"a":1,"b":2},{"a":3,"b":4}]'], out: ['a,b\n1,2\n3,4'] },
    { params: { delimiter: ',' }, in: ['[]'], out: [''] }
  ]
};
