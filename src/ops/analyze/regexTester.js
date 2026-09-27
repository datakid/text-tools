export default {
  id: 'analyze.regexTester',
  name: 'Regex tester',
  group: 'Analyze',
  summary: 'Report match count and sample matches for a pattern, without altering the document.',
  arity: 'map',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    { key: 'pattern', type: 'regex', label: 'Pattern', default: '' },
    { key: 'caseSensitive', type: 'bool', label: 'Case-sensitive', default: true },
    { key: 'sampleLimit', type: 'int', label: 'Sample limit', default: 50, min: 1 }
  ],
  describe(p) {
    return `Test pattern "${p.pattern}"`;
  },
  run(docs, p) {
    if (!p.pattern) return docs.map((d) => ({ ...d, text: 'No pattern set' }));
    let re;
    try {
      re = new RegExp(p.pattern, p.caseSensitive ? 'g' : 'gi');
    } catch (e) {
      return docs.map((d) => ({ ...d, text: `Invalid pattern: ${e.message}` }));
    }
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const hits = [];
      outer:
      for (let li = 0; li < lines.length; li++) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(lines[li]))) {
          hits.push({ line: li + 1, col: m.index + 1, text: m[0] });
          if (m[0].length === 0) re.lastIndex += 1;
          if (hits.length >= p.sampleLimit) break outer;
        }
      }
      const rows = [`Matches: ${hits.length}${hits.length >= p.sampleLimit ? '+' : ''}`, '', ...hits.map((h) => `L${h.line}:C${h.col}\t${h.text}`)];
      return { ...d, text: rows.join('\n') };
    });
  },
  examples: [
    {
      params: { pattern: '\\d+', caseSensitive: true, sampleLimit: 50 },
      in: ['room 12\nroom 34'],
      out: ['Matches: 2\n\nL1:C6\t12\nL2:C6\t34']
    },
    { params: { pattern: '', caseSensitive: true, sampleLimit: 50 }, in: ['anything'], out: ['No pattern set'] }
  ]
};
