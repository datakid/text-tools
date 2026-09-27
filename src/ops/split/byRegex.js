export default {
  id: 'split.byRegex',
  name: 'Split by pattern',
  group: 'Split',
  summary: 'Split a document at every match of a regular expression.',
  arity: 'split',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    { key: 'pattern', type: 'regex', label: 'Pattern', default: '\\n\\n+' },
    {
      key: 'keepDelimiter',
      type: 'enum',
      label: 'Delimiter',
      default: 'drop',
      options: [
        ['drop', 'Drop'],
        ['before', 'Keep with chunk before'],
        ['after', 'Keep with chunk after']
      ]
    },
    {
      key: 'name',
      type: 'template',
      label: 'Chunk name',
      default: '{{base}}-{{i:pad3}}',
      tokens: ['{{base}}', '{{i}}', '{{n}}']
    }
  ],
  describe(p) {
    return `Split on pattern (${p.keepDelimiter})`;
  },
  run(docs, p) {
    const out = [];
    docs.forEach((d) => {
      let re;
      try {
        re = new RegExp(p.pattern, 'g');
      } catch (e) {
        out.push(d);
        return;
      }
      const parts = [];
      let last = 0;
      let m;
      while ((m = re.exec(d.text))) {
        const matchEnd = m.index + m[0].length;
        parts.push(p.keepDelimiter === 'before' ? d.text.slice(last, matchEnd) : d.text.slice(last, m.index));
        last = p.keepDelimiter === 'after' ? m.index : matchEnd;
        if (m[0].length === 0) re.lastIndex += 1;
      }
      parts.push(d.text.slice(last));

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
    { params: { pattern: '-+', keepDelimiter: 'drop', name: '{{base}}-{{i:pad3}}' }, in: ['aaa---bbb----ccc'], out: ['aaa', 'bbb', 'ccc'] },
    { params: { pattern: 'x', keepDelimiter: 'drop', name: '{{base}}-{{i:pad3}}' }, in: [''], out: [''] }
  ]
};
