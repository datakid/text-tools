function wrapLine(line, width, mode) {
  if (line.length === 0) return '';
  if (mode === 'hard') {
    const out = [];
    for (let i = 0; i < line.length; i += width) out.push(line.slice(i, i + width));
    return out.join('\n');
  }
  const words = line.split(' ');
  const out = [];
  let current = '';
  for (const word of words) {
    if (current === '') {
      current = word;
    } else if ((current + ' ' + word).length <= width) {
      current += ` ${word}`;
    } else {
      out.push(current);
      current = word;
    }
  }
  if (current !== '') out.push(current);
  return out.join('\n');
}

export default {
  id: 'text.wrap',
  name: 'Wrap',
  group: 'Text',
  summary: 'Wrap text to a maximum column width, either hard-cutting or breaking at word boundaries.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'width', type: 'int', label: 'Column width', default: 80, min: 1 },
    {
      key: 'mode',
      type: 'enum',
      label: 'Mode',
      default: 'soft',
      options: [
        ['hard', 'Hard (cut mid-word)'],
        ['soft', 'Soft (break at words)']
      ]
    }
  ],
  describe(p) {
    return `Wrap at ${p.width} (${p.mode})`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/).map((line) => wrapLine(line, p.width, p.mode));
      return { ...d, text: lines.join('\n') };
    });
  },
  examples: [
    { params: { width: 5, mode: 'hard' }, in: ['abcdefgh'], out: ['abcde\nfgh'] },
    { params: { width: 5, mode: 'soft' }, in: ['a bb ccc dddd'], out: ['a bb\nccc\ndddd'] },
    { params: { width: 5, mode: 'soft' }, in: [''], out: [''] }
  ]
};
