export default {
  id: 'lines.splitToLines',
  name: 'Split items onto lines',
  group: 'Lines',
  summary: 'Break a comma-, semicolon-, tab-, pipe- or custom-separated list into one item per line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'delimiter',
      type: 'enum',
      label: 'Separator',
      default: 'comma',
      options: [
        ['comma', 'Comma'],
        ['semicolon', 'Semicolon'],
        ['tab', 'Tab'],
        ['pipe', 'Pipe |'],
        ['space', 'Whitespace'],
        ['custom', 'Custom']
      ]
    },
    { key: 'custom', type: 'string', label: 'Custom separator', default: '', show: (p) => p.delimiter === 'custom' },
    { key: 'trim', type: 'bool', label: 'Trim items', default: true },
    { key: 'skipEmpty', type: 'bool', label: 'Skip empty items', default: true }
  ],
  describe(p) {
    return `Split on ${p.delimiter === 'custom' ? `"${p.custom}"` : p.delimiter}`;
  },
  run(docs, p) {
    const map = { comma: ',', semicolon: ';', tab: '\t', pipe: '|' };
    return docs.map((d) => {
      let items;
      if (p.delimiter === 'space') items = d.text.split(/\s+/);
      else {
        const sep = p.delimiter === 'custom' ? p.custom : map[p.delimiter];
        if (!sep) return d;
        items = d.text.split(/\r\n|\r|\n/).flatMap((line) => line.split(sep));
      }
      if (p.trim) items = items.map((s) => s.trim());
      if (p.skipEmpty) items = items.filter((s) => s !== '');
      return { ...d, text: items.join('\n') };
    });
  },
  examples: [
    { params: { delimiter: 'comma', custom: '', trim: true, skipEmpty: true }, in: ['a, b,,c\nd'], out: ['a\nb\nc\nd'] },
    { params: { delimiter: 'custom', custom: '::', trim: false, skipEmpty: false }, in: ['x::y'], out: ['x\ny'] },
    { params: { delimiter: 'space', custom: '', trim: true, skipEmpty: true }, in: ['  one two\tthree '], out: ['one\ntwo\nthree'] }
  ]
};
