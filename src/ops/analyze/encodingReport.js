export default {
  id: 'analyze.encodingReport',
  name: 'Encoding report',
  group: 'Analyze',
  summary: 'Report BOM presence, dominant line ending, and ASCII/non-ASCII character counts.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'linear',
  params: [],
  describe() {
    return 'Encoding report';
  },
  run(docs) {
    return docs.map((d) => {
      const text = d.text;
      const hasBOM = text.charCodeAt(0) === 0xfeff;
      const crlf = (text.match(/\r\n/g) || []).length;
      const lf = (text.match(/(?<!\r)\n/g) || []).length;
      const cr = (text.match(/\r(?!\n)/g) || []).length;
      const dominant = crlf >= lf && crlf >= cr && crlf > 0 ? 'CRLF' : cr > lf && cr > 0 ? 'CR' : 'LF';
      const nonAscii = [...text].filter((c) => c.codePointAt(0) > 127).length;
      const lines = text.split(/\r\n|\r|\n/);
      const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
      const rows = [
        `BOM\t${hasBOM ? 'yes' : 'no'}`,
        `Dominant line ending\t${dominant}`,
        `Characters\t${text.length}`,
        `Non-ASCII characters\t${nonAscii}`,
        `Lines\t${lines.length}`,
        `Longest line\t${longest}`
      ];
      return { ...d, text: rows.join('\n') };
    });
  },
  examples: [
    {
      params: {},
      in: ['caf\u00e9\r\nsecond'],
      out: ['BOM\tno\nDominant line ending\tCRLF\nCharacters\t12\nNon-ASCII characters\t1\nLines\t2\nLongest line\t6']
    },
    {
      params: {},
      in: [''],
      out: ['BOM\tno\nDominant line ending\tLF\nCharacters\t0\nNon-ASCII characters\t0\nLines\t1\nLongest line\t0']
    }
  ]
};
