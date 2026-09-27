import { parseDelimitedLine } from './_shared.js';

export default {
  id: 'data.toMarkdownTable',
  name: 'To Markdown table',
  group: 'Data',
  summary: 'Convert delimited data into a Markdown table.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'delimiter', type: 'string', label: 'Delimiter', default: ',' }],
  describe() {
    return 'Convert to Markdown table';
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/).filter((l) => l !== '');
      if (lines.length === 0) return { ...d, text: '' };
      const rows = lines.map((line) => parseDelimitedLine(line, p.delimiter));
      const fmt = (cells) => `| ${cells.join(' | ')} |`;
      const sep = rows[0].map(() => '---');
      const text = [fmt(rows[0]), fmt(sep), ...rows.slice(1).map(fmt)].join('\n');
      return { ...d, text };
    });
  },
  examples: [
    { params: { delimiter: ',' }, in: ['name,age\nAlice,30\nBob,25'], out: ['| name | age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |'] },
    { params: { delimiter: ',' }, in: [''], out: [''] }
  ]
};
