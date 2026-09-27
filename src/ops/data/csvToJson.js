import { parseDelimitedLine } from './_shared.js';

export default {
  id: 'data.csvToJson',
  name: 'CSV to JSON',
  group: 'Data',
  summary: 'Parse delimited rows into a JSON array of objects, using the first row as headers.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'delimiter', type: 'string', label: 'Delimiter', default: ',' }],
  describe() {
    return 'CSV to JSON';
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/).filter((l) => l !== '');
      if (lines.length === 0) return { ...d, text: '[]' };
      const headers = parseDelimitedLine(lines[0], p.delimiter);
      const rows = lines.slice(1).map((line) => {
        const cells = parseDelimitedLine(line, p.delimiter);
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = cells[i] ?? '';
        });
        return obj;
      });
      return { ...d, text: JSON.stringify(rows, null, 2) };
    });
  },
  examples: [
    { params: { delimiter: ',' }, in: ['a,b\n1,2\n3,4'], out: ['[\n  {\n    "a": "1",\n    "b": "2"\n  },\n  {\n    "a": "3",\n    "b": "4"\n  }\n]'] },
    { params: { delimiter: ',' }, in: [''], out: ['[]'] }
  ]
};
