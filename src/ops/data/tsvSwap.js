import { parseDelimitedLine, escapeDelimitedField } from './_shared.js';

export default {
  id: 'data.tsvSwap',
  name: 'Swap CSV/TSV',
  group: 'Data',
  summary: 'Re-delimit CSV to TSV or TSV to CSV, respecting quoted fields.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Direction',
      default: 'csvToTsv',
      options: [
        ['csvToTsv', 'CSV \u2192 TSV'],
        ['tsvToCsv', 'TSV \u2192 CSV']
      ]
    }
  ],
  describe(p) {
    return p.mode === 'csvToTsv' ? 'CSV \u2192 TSV' : 'TSV \u2192 CSV';
  },
  run(docs, p) {
    const fromDelim = p.mode === 'csvToTsv' ? ',' : '\t';
    const toDelim = p.mode === 'csvToTsv' ? '\t' : ',';
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const out = lines.map((line) => {
        if (line === '') return '';
        const cells = parseDelimitedLine(line, fromDelim);
        return cells.map((c) => escapeDelimitedField(c, toDelim)).join(toDelim);
      });
      return { ...d, text: out.join('\n') };
    });
  },
  examples: [
    { params: { mode: 'csvToTsv' }, in: ['a,b,c\n1,2,3'], out: ['a\tb\tc\n1\t2\t3'] },
    { params: { mode: 'csvToTsv' }, in: ['a,"has, comma"'], out: ['a\thas, comma'] }
  ]
};
