export default {
  id: 'ws.tabsToSpaces',
  name: 'Tabs to spaces',
  group: 'Whitespace',
  summary: 'Replace every tab character with a fixed number of spaces.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'width', type: 'int', label: 'Spaces per tab', default: 4, min: 1, max: 16 }],
  describe(p) {
    return `Tabs \u2192 ${p.width} spaces`;
  },
  run(docs, p) {
    const spaces = ' '.repeat(p.width);
    return docs.map((d) => ({ ...d, text: d.text.replace(/\t/g, spaces) }));
  },
  examples: [
    { params: { width: 2 }, in: ['a\tb'], out: ['a  b'] },
    { params: { width: 2 }, in: ['\ud83d\ude00\t\ud83d\ude00'], out: ['\ud83d\ude00  \ud83d\ude00'] }
  ]
};
