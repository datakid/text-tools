export default {
  id: 'split.byDelimiterLine',
  name: 'Split by delimiter line',
  group: 'Split',
  summary: 'Split a document wherever an entire line matches a delimiter.',
  arity: 'split',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Match',
      default: 'literal',
      options: [
        ['literal', 'Literal line'],
        ['regex', 'Regex (whole line)']
      ]
    },
    { key: 'value', type: 'string', label: 'Delimiter', default: '---' },
    { key: 'keepDelimiter', type: 'bool', label: 'Keep delimiter line', default: false },
    {
      key: 'name',
      type: 'template',
      label: 'Chunk name',
      default: '{{base}}-{{i:pad3}}',
      tokens: ['{{base}}', '{{i}}', '{{n}}']
    }
  ],
  describe(p) {
    return `Split at delimiter line "${p.value}"`;
  },
  run(docs, p) {
    const out = [];
    const re = p.mode === 'regex' ? new RegExp(`^${p.value}$`) : null;
    const isDelim = (l) => (p.mode === 'regex' ? re.test(l) : l === p.value);

    docs.forEach((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const parts = [];
      let current = [];
      for (const line of lines) {
        if (isDelim(line)) {
          if (p.keepDelimiter) current.push(line);
          parts.push(current.join('\n'));
          current = [];
        } else {
          current.push(line);
        }
      }
      parts.push(current.join('\n'));

      const n = parts.length;
      parts.forEach((text, i) => {
        const name = p.name
          .replace('{{base}}', d.name)
          .replace('{{i:pad3}}', String(i + 1).padStart(3, '0'))
          .replace('{{i}}', String(i + 1))
          .replace('{{n}}', String(n));
        out.push({ id: `${d.id}-${i}`, name, text, meta: { ...d.meta, parent: d.id, chunkIndex: i } });
      });
    });
    return out;
  },
  examples: [
    {
      params: { mode: 'literal', value: '---', keepDelimiter: false, name: '{{base}}-{{i:pad3}}' },
      in: ['a\nb\n---\nc\nd'],
      out: ['a\nb', 'c\nd']
    },
    {
      params: { mode: 'literal', value: '---', keepDelimiter: false, name: '{{base}}-{{i:pad3}}' },
      in: ['solo'],
      out: ['solo']
    }
  ]
};
