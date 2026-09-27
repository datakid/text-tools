import { diffLines } from '../../core/diff.js';

function formatDiff(ops) {
  return ops.map((op) => (op.type === 'add' ? `+${op.line}` : op.type === 'remove' ? `-${op.line}` : ` ${op.line}`)).join('\n');
}

export default {
  id: 'analyze.diff',
  name: 'Diff documents',
  group: 'Analyze',
  summary: 'Compare documents with a Myers line diff, either pairwise or each against the first.',
  arity: 'split',
  previewFidelity: 'none',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Compare',
      default: 'pairwise',
      options: [
        ['pairwise', 'Each doc vs. the next'],
        ['vsFirst', 'Each doc vs. the first']
      ]
    }
  ],
  describe(p) {
    return p.mode === 'pairwise' ? 'Diff consecutive documents' : 'Diff each document vs. the first';
  },
  run(docs, p) {
    if (docs.length < 2) return [{ id: 'diff', name: 'diff.txt', text: '', meta: {} }];
    const out = [];
    if (p.mode === 'vsFirst') {
      const base = docs[0].text.split(/\r\n|\r|\n/);
      for (let i = 1; i < docs.length; i++) {
        const ops = diffLines(base, docs[i].text.split(/\r\n|\r|\n/));
        out.push({ id: `diff-${i}`, name: `${docs[0].name}-vs-${docs[i].name}`, text: formatDiff(ops), meta: {} });
      }
    } else {
      for (let i = 0; i + 1 < docs.length; i++) {
        const ops = diffLines(docs[i].text.split(/\r\n|\r|\n/), docs[i + 1].text.split(/\r\n|\r|\n/));
        out.push({ id: `diff-${i}`, name: `${docs[i].name}-vs-${docs[i + 1].name}`, text: formatDiff(ops), meta: {} });
      }
    }
    return out;
  },
  examples: [
    {
      params: { mode: 'pairwise' },
      in: ['line1\nline2\nline3', 'line1\nlineX\nline3'],
      out: [' line1\n-line2\n+lineX\n line3']
    },
    { params: { mode: 'pairwise' }, in: ['solo'], out: [''] }
  ]
};
