function locate(text, message) {
  const m = /position (\d+)/i.exec(message);
  if (!m) {
    const lc = /line (\d+) column (\d+)/i.exec(message);
    return lc ? { line: Number(lc[1]), col: Number(lc[2]) } : null;
  }
  const pos = Number(m[1]);
  const before = text.slice(0, pos).split(/\r\n|\r|\n/);
  return { line: before.length, col: before[before.length - 1].length + 1 };
}

function shape(value) {
  if (Array.isArray(value)) return `array of ${value.length} item${value.length === 1 ? '' : 's'}`;
  if (value === null) return 'null';
  if (typeof value === 'object') {
    const n = Object.keys(value).length;
    return `object with ${n} key${n === 1 ? '' : 's'}`;
  }
  return typeof value;
}

export default {
  id: 'data.jsonValidate',
  name: 'Validate JSON',
  group: 'Data',
  summary: 'Check whether each document is valid JSON and report its shape, or the line and column of the first error.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'linesMode', type: 'bool', label: 'Validate each line (JSON Lines)', default: false }],
  describe(p) {
    return p.linesMode ? 'Validate JSON Lines' : 'Validate JSON';
  },
  run(docs, p) {
    return docs.map((d) => {
      if (p.linesMode) {
        const lines = d.text.split(/\r\n|\r|\n/);
        const report = [];
        let bad = 0;
        lines.forEach((line, i) => {
          if (!line.trim()) return;
          try {
            JSON.parse(line);
          } catch (e) {
            bad += 1;
            report.push(`line ${i + 1}: ${e.message}`);
          }
        });
        return { ...d, text: bad ? `invalid: ${bad} bad line${bad === 1 ? '' : 's'}\n${report.join('\n')}` : 'valid: every line parses' };
      }
      if (!d.text.trim()) return { ...d, text: 'invalid: empty document' };
      try {
        return { ...d, text: `valid: ${shape(JSON.parse(d.text))}` };
      } catch (e) {
        const at = locate(d.text, e.message);
        return { ...d, text: `invalid${at ? ` at line ${at.line}, column ${at.col}` : ''}: ${e.message}` };
      }
    });
  },
  examples: [
    { params: { linesMode: false }, in: ['{"a":[1,2]}'], out: ['valid: object with 1 key'] },
    { params: { linesMode: false }, in: [''], out: ['invalid: empty document'] },
    { params: { linesMode: true }, in: ['{"a":1}\n[1,2]\n'], out: ['valid: every line parses'] }
  ]
};
