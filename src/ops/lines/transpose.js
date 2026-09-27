export default {
  id: 'lines.transpose',
  name: 'Transpose',
  group: 'Lines',
  summary: 'Treat lines as delimited rows and transpose rows and columns.',
  arity: 'map',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    { key: 'separator', type: 'string', label: 'Input separator', default: '\t' },
    {
      key: 'outputSeparator',
      type: 'string',
      label: 'Output separator',
      default: '',
      help: 'Leave blank to reuse the input separator'
    }
  ],
  describe() {
    return 'Transpose rows and columns';
  },
  run(docs, p) {
    const outSep = p.outputSeparator || p.separator;
    return docs.map((d) => {
      const rows = d.text.split(/\r\n|\r|\n/).map((l) => l.split(p.separator));
      const cols = Math.max(0, ...rows.map((r) => r.length));
      const out = [];
      for (let c = 0; c < cols; c++) {
        out.push(rows.map((r) => (r[c] !== undefined ? r[c] : '')).join(outSep));
      }
      return { ...d, text: out.join('\n') };
    });
  },
  examples: [
    { params: { separator: ',', outputSeparator: '' }, in: ['a,b,c\nd,e,f'], out: ['a,d\nb,e\nc,f'] },
    { params: { separator: ',', outputSeparator: '' }, in: ['solo'], out: ['solo'] }
  ]
};
