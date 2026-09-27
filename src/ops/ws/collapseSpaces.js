export default {
  id: 'ws.collapseSpaces',
  name: 'Collapse spaces',
  group: 'Whitespace',
  summary: 'Collapse runs of horizontal whitespace into a single space, without touching newlines.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'collapseTabs', type: 'bool', label: 'Include tabs', default: true }],
  describe(p) {
    return p.collapseTabs ? 'Collapse runs of spaces and tabs' : 'Collapse runs of spaces';
  },
  run(docs, p) {
    const re = p.collapseTabs ? /[ \t]+/g : / +/g;
    return docs.map((d) => ({ ...d, text: d.text.replace(re, ' ') }));
  },
  examples: [
    { params: { collapseTabs: true }, in: ['a   b\t\tc\r\nd    e'], out: ['a b c\r\nd e'] },
    { params: { collapseTabs: true }, in: ['single'], out: ['single'] }
  ]
};
