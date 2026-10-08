import { parseDelimitedLine } from '../data/_shared.js';

function width(s) {
  return [...s].length;
}

export default {
  id: 'lines.align',
  name: 'Align columns',
  group: 'Lines',
  summary: 'Pad delimited columns so they line up in a readable, monospaced table.',
  arity: 'map',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    { key: 'delimiter', type: 'string', label: 'Input delimiter', default: ',' },
    { key: 'gap', type: 'string', label: 'Column gap', default: '  ' },
    { key: 'quoted', type: 'bool', label: 'Respect "quoted" fields', default: true },
    {
      key: 'alignNumbers',
      type: 'bool',
      label: 'Right-align numbers',
      default: true
    }
  ],
  describe(p) {
    return `Align columns on "${p.delimiter}"`;
  },
  run(docs, p) {
    const delim = p.delimiter || ',';
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const rows = lines.map((l) => (l === '' ? null : p.quoted ? parseDelimitedLine(l, delim) : l.split(delim)));
      const filled = rows.filter(Boolean);
      const cols = filled.reduce((m, r) => Math.max(m, r.length), 0);
      const widths = new Array(cols).fill(0);
      for (const r of filled) r.forEach((cell, c) => { widths[c] = Math.max(widths[c], width(cell.trim())); });
      const out = rows.map((r) => {
        if (!r) return '';
        return r
          .map((cell, c) => {
            const v = cell.trim();
            const pad = ' '.repeat(widths[c] - width(v));
            const numeric = p.alignNumbers && /^-?\d+(?:[.,]\d+)?%?$/.test(v);
            return numeric ? pad + v : v + pad;
          })
          .join(p.gap)
          .replace(/\s+$/, '');
      });
      return { ...d, text: out.join('\n') };
    });
  },
  examples: [
    { params: { delimiter: ',', gap: '  ', quoted: true, alignNumbers: true }, in: ['name,qty\napple,3\nkiwi,12'], out: ['name   qty\napple    3\nkiwi    12'] },
    { params: { delimiter: '|', gap: ' | ', quoted: false, alignNumbers: false }, in: ['a|bb\nccc|d'], out: ['a   | bb\nccc | d'] }
  ]
};
