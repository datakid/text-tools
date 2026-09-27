import { parseDelimitedLine } from './_shared.js';

export default {
  id: 'data.csvReshape',
  name: 'Reshape CSV columns',
  group: 'Data',
  summary: 'Select, reorder, and optionally rename columns of delimited data.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'delimiter', type: 'string', label: 'Delimiter', default: ',' },
    {
      key: 'columns',
      type: 'string',
      label: 'Columns',
      default: '',
      help: 'Comma-separated, in the desired order. Use old:new to rename, e.g. name:full_name'
    }
  ],
  describe(p) {
    return `Reshape columns: ${p.columns}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/).filter((l) => l !== '');
      if (lines.length === 0 || !p.columns) return { ...d, text: '' };
      const headers = parseDelimitedLine(lines[0], p.delimiter);
      const spec = p.columns.split(',').map((s) => {
        const [oldName, newName] = s.trim().split(':').map((x) => x.trim());
        return { oldName, newName: newName || oldName };
      });
      const idxs = spec.map((s) => headers.indexOf(s.oldName));
      const outHeader = spec.map((s) => s.newName).join(p.delimiter);
      const outRows = lines.slice(1).map((line) => {
        const cells = parseDelimitedLine(line, p.delimiter);
        return idxs.map((i) => cells[i] ?? '').join(p.delimiter);
      });
      return { ...d, text: [outHeader, ...outRows].join('\n') };
    });
  },
  examples: [
    { params: { delimiter: ',', columns: 'b,a' }, in: ['a,b,c\n1,2,3\n4,5,6'], out: ['b,a\n2,1\n5,4'] },
    { params: { delimiter: ',', columns: 'a:id' }, in: ['a,b\n1,2'], out: ['id\n1'] }
  ]
};
