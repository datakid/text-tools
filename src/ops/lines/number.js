export default {
  id: 'lines.number',
  name: 'Number lines',
  group: 'Lines',
  summary: 'Prepend a formatted line number to every line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'template', type: 'template', label: 'Template', default: '{{n}}. ', tokens: ['{{n}}'] },
    { key: 'start', type: 'int', label: 'Start at', default: 1 },
    { key: 'step', type: 'int', label: 'Step', default: 1 },
    { key: 'pad', type: 'int', label: 'Zero-pad width', default: 0, min: 0 }
  ],
  describe(p) {
    return `Number lines from ${p.start}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const out = lines.map((line, i) => {
        const n = p.start + i * p.step;
        const label = p.pad > 0 ? String(n).padStart(p.pad, '0') : String(n);
        return p.template.replace('{{n}}', label) + line;
      });
      return { ...d, text: out.join('\n') };
    });
  },
  examples: [
    { params: { template: '{{n}}. ', start: 1, step: 1, pad: 0 }, in: ['a\nb'], out: ['1. a\n2. b'] },
    { params: { template: '{{n}}. ', start: 1, step: 1, pad: 0 }, in: [''], out: ['1. '] }
  ]
};
