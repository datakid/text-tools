export default {
  id: 'merge.reduceToTable',
  name: 'Reduce to table',
  group: 'Merge',
  summary: 'Combine documents into a delimited table, one column per document.',
  arity: 'merge',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'separator', type: 'string', label: 'Separator', default: '\t' },
    { key: 'includeHeader', type: 'bool', label: 'Include header row', default: true }
  ],
  describe() {
    return 'Reduce documents to a table';
  },
  run(docs, p) {
    if (docs.length === 0) return docs;
    const lineSets = docs.map((d) => d.text.split(/\r\n|\r|\n/));
    const maxLen = Math.max(...lineSets.map((l) => l.length));
    const rows = [];
    if (p.includeHeader) rows.push(docs.map((d) => d.name).join(p.separator));
    for (let i = 0; i < maxLen; i++) {
      rows.push(lineSets.map((lines) => (i < lines.length ? lines[i] : '')).join(p.separator));
    }
    return [{ id: 'table', name: 'table.tsv', text: rows.join('\n'), meta: {} }];
  },
  examples: [
    { params: { separator: ',', includeHeader: true }, in: ['a\nb', '1\n2'], out: ['doc_0,doc_1\na,1\nb,2'] },
    { params: { separator: ',', includeHeader: false }, in: ['x'], out: ['x'] }
  ]
};
