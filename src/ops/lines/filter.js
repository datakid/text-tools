export default {
  id: 'lines.filter',
  name: 'Filter lines',
  group: 'Lines',
  summary: 'Keep or exclude lines by substring, regex, length, index, duplicate status, or blankness.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Keep lines that',
      default: 'contains',
      options: [
        ['contains', 'Contain text'],
        ['notContains', 'Do not contain text'],
        ['regex', 'Match a regex'],
        ['lengthRange', 'Have length in range'],
        ['indexRange', 'Have index in range'],
        ['duplicatesOnly', 'Are duplicates (2nd+ occurrence)'],
        ['blank', 'Are blank'],
        ['notBlank', 'Are not blank']
      ]
    },
    { key: 'value', type: 'string', label: 'Text', default: '', show: (p) => p.mode === 'contains' || p.mode === 'notContains' },
    { key: 'pattern', type: 'regex', label: 'Pattern', default: '', show: (p) => p.mode === 'regex' },
    {
      key: 'caseSensitive',
      type: 'bool',
      label: 'Case-sensitive',
      default: true,
      show: (p) => ['contains', 'notContains', 'regex'].includes(p.mode)
    },
    { key: 'min', type: 'int', label: 'Min', default: 0, min: 0, show: (p) => p.mode === 'lengthRange' || p.mode === 'indexRange' },
    { key: 'max', type: 'int', label: 'Max', default: 1000000, min: 0, show: (p) => p.mode === 'lengthRange' || p.mode === 'indexRange' }
  ],
  describe(p) {
    return `Keep lines: ${p.mode}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const seen = new Set();
      const out = lines.filter((line, i) => {
        if (p.mode === 'contains' || p.mode === 'notContains') {
          const hay = p.caseSensitive ? line : line.toLowerCase();
          const needle = p.caseSensitive ? p.value : p.value.toLowerCase();
          const has = hay.includes(needle);
          return p.mode === 'contains' ? has : !has;
        }
        if (p.mode === 'regex') {
          if (!p.pattern) return true;
          const re = new RegExp(p.pattern, p.caseSensitive ? '' : 'i');
          return re.test(line);
        }
        if (p.mode === 'lengthRange') return line.length >= p.min && line.length <= p.max;
        if (p.mode === 'indexRange') return i >= p.min && i <= p.max;
        if (p.mode === 'duplicatesOnly') {
          if (seen.has(line)) return true;
          seen.add(line);
          return false;
        }
        if (p.mode === 'blank') return line.trim() === '';
        if (p.mode === 'notBlank') return line.trim() !== '';
        return true;
      });
      return { ...d, text: out.join('\n') };
    });
  },
  examples: [
    {
      params: { mode: 'contains', value: 'a', pattern: '', caseSensitive: true, min: 0, max: 1000000 },
      in: ['apple\nbanana\ncherry'],
      out: ['apple\nbanana']
    },
    {
      params: { mode: 'notBlank', value: '', pattern: '', caseSensitive: true, min: 0, max: 1000000 },
      in: [''],
      out: ['']
    }
  ]
};
