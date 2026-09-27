export default {
  id: 'extract.markdownHeadings',
  name: 'Extract Markdown headings',
  group: 'Extract',
  summary: 'Extract every Markdown heading line, optionally limited to a max level.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'maxLevel', type: 'int', label: 'Max level (#)', default: 6, min: 1, max: 6 },
    { key: 'includeMarkers', type: 'bool', label: 'Keep # markers', default: true }
  ],
  describe(p) {
    return `Extract headings (H1\u2013H${p.maxLevel})`;
  },
  run(docs, p) {
    const re = /^(#{1,6})\s+(.*)$/gm;
    return docs.map((d) => {
      const rows = [];
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(d.text))) {
        if (m[1].length <= p.maxLevel) rows.push(p.includeMarkers ? `${m[1]} ${m[2]}` : m[2]);
      }
      return { ...d, text: rows.join('\n') };
    });
  },
  examples: [
    { params: { maxLevel: 2, includeMarkers: true }, in: ['# Title\ntext\n## Sub\nmore\n### Deep'], out: ['# Title\n## Sub'] },
    { params: { maxLevel: 6, includeMarkers: false }, in: ['no headings'], out: [''] }
  ]
};
