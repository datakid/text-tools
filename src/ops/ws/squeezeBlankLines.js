export default {
  id: 'ws.squeezeBlankLines',
  name: 'Squeeze blank lines',
  group: 'Whitespace',
  summary: 'Collapse consecutive blank lines down to at most N in a row.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'max', type: 'int', label: 'Max consecutive blank lines', default: 1, min: 0 }],
  describe(p) {
    return `Squeeze blank lines to \u2264 ${p.max}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const out = [];
      let run = 0;
      for (const line of lines) {
        if (line.trim() === '') {
          run += 1;
          if (run <= p.max) out.push(line);
        } else {
          run = 0;
          out.push(line);
        }
      }
      return { ...d, text: out.join('\n') };
    });
  },
  examples: [
    { params: { max: 1 }, in: ['a\n\n\n\nb'], out: ['a\n\nb'] },
    { params: { max: 0 }, in: ['a\n\nb'], out: ['a\nb'] }
  ]
};
