export default {
  id: 'ws.trimLines',
  name: 'Trim lines',
  group: 'Whitespace',
  summary: 'Remove leading and/or trailing whitespace from every line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'side',
      type: 'enum',
      label: 'Trim',
      default: 'both',
      options: [
        ['both', 'Both ends'],
        ['start', 'Start only'],
        ['end', 'End only']
      ]
    }
  ],
  describe(p) {
    return p.side === 'both' ? 'Trim both ends of each line' : `Trim ${p.side} of each line`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const trimmed = lines.map((l) => {
        if (p.side === 'start') return l.replace(/^\s+/, '');
        if (p.side === 'end') return l.replace(/\s+$/, '');
        return l.trim();
      });
      return { ...d, text: trimmed.join('\n') };
    });
  },
  examples: [
    { params: { side: 'both' }, in: ['  a  \n b '], out: ['a\nb'] },
    { params: { side: 'both' }, in: [''], out: [''] }
  ]
};
