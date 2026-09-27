export default {
  id: 'extract.columns',
  name: 'Extract columns',
  group: 'Extract',
  summary: 'Extract specific columns from delimited or fixed-width lines.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Mode',
      default: 'delimited',
      options: [
        ['delimited', 'Delimited'],
        ['fixedWidth', 'Fixed width']
      ]
    },
    { key: 'delimiter', type: 'string', label: 'Delimiter', default: ',', show: (p) => p.mode === 'delimited' },
    {
      key: 'columns',
      type: 'string',
      label: 'Columns',
      default: '1',
      help: 'Delimited: comma-separated 1-based indices (e.g. 1,3). Fixed width: comma-separated ranges (e.g. 0-3,4-7).'
    },
    { key: 'outputSeparator', type: 'string', label: 'Output separator', default: ',' }
  ],
  describe(p) {
    return `Extract columns: ${p.columns}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      let out;
      if (p.mode === 'delimited') {
        const idxs = p.columns.split(',').map((s) => parseInt(s.trim(), 10) - 1);
        out = lines.map((line) => {
          const cells = line.split(p.delimiter);
          return idxs.map((i) => cells[i] ?? '').join(p.outputSeparator);
        });
      } else {
        const ranges = p.columns.split(',').map((s) => s.split('-').map((x) => parseInt(x.trim(), 10)));
        out = lines.map((line) => ranges.map(([a, b]) => line.slice(a, b)).join(p.outputSeparator));
      }
      return { ...d, text: out.join('\n') };
    });
  },
  examples: [
    { params: { mode: 'delimited', delimiter: ',', columns: '1,3', outputSeparator: ',' }, in: ['a,b,c\nd,e,f'], out: ['a,c\nd,f'] },
    { params: { mode: 'fixedWidth', delimiter: ',', columns: '0-3,3-6', outputSeparator: '|' }, in: ['abcdefgh'], out: ['abc|def'] }
  ]
};
