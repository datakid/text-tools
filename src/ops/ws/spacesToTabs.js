export default {
  id: 'ws.spacesToTabs',
  name: 'Spaces to tabs',
  group: 'Whitespace',
  summary: 'Convert leading indentation spaces back into tabs.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'width', type: 'int', label: 'Spaces per tab', default: 4, min: 1, max: 16 },
    { key: 'leadingOnly', type: 'bool', label: 'Leading indentation only', default: true }
  ],
  describe(p) {
    return `${p.width} spaces \u2192 tab${p.leadingOnly ? ' (leading only)' : ''}`;
  },
  run(docs, p) {
    const unit = ' '.repeat(p.width);
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/).map((line) => {
        if (!p.leadingOnly) return line.split(unit).join('\t');
        const m = line.match(/^ +/);
        if (!m) return line;
        const leading = m[0];
        const tabCount = Math.floor(leading.length / p.width);
        const remainder = leading.length % p.width;
        return '\t'.repeat(tabCount) + ' '.repeat(remainder) + line.slice(leading.length);
      });
      return { ...d, text: lines.join('\n') };
    });
  },
  examples: [
    { params: { width: 4, leadingOnly: true }, in: ['    a\r\n    b'], out: ['\ta\n\tb'] },
    { params: { width: 4, leadingOnly: true }, in: [''], out: [''] }
  ]
};
