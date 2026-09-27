export default {
  id: 'text.pad',
  name: 'Pad',
  group: 'Text',
  summary: 'Pad each line, or the whole document, to a fixed width.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'scope',
      type: 'enum',
      label: 'Scope',
      default: 'perLine',
      options: [
        ['perLine', 'Each line'],
        ['wholeText', 'Whole document']
      ]
    },
    { key: 'width', type: 'int', label: 'Width', default: 10, min: 0 },
    {
      key: 'side',
      type: 'enum',
      label: 'Side',
      default: 'end',
      options: [
        ['start', 'Start'],
        ['end', 'End'],
        ['both', 'Both (center)']
      ]
    },
    { key: 'char', type: 'string', label: 'Pad character', default: ' ' }
  ],
  describe(p) {
    return `Pad ${p.scope === 'perLine' ? 'each line' : 'document'} to ${p.width}`;
  },
  run(docs, p) {
    const ch = p.char || ' ';
    const padOne = (s) => {
      if (s.length >= p.width) return s;
      const total = p.width - s.length;
      if (p.side === 'start') return ch.repeat(total) + s;
      if (p.side === 'end') return s + ch.repeat(total);
      const left = Math.floor(total / 2);
      const right = total - left;
      return ch.repeat(left) + s + ch.repeat(right);
    };
    return docs.map((d) => ({
      ...d,
      text: p.scope === 'perLine' ? d.text.split(/\r\n|\r|\n/).map(padOne).join('\n') : padOne(d.text)
    }));
  },
  examples: [
    { params: { scope: 'perLine', width: 5, side: 'end', char: '.' }, in: ['a\nbb'], out: ['a....\nbb...'] },
    { params: { scope: 'perLine', width: 0, side: 'end', char: ' ' }, in: [''], out: [''] }
  ]
};
