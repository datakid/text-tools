export default {
  id: 'lines.dedupe',
  name: 'Dedupe lines',
  group: 'Lines',
  summary: 'Remove duplicate lines, globally or only adjacent repeats.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'linear',
  params: [
    {
      key: 'scope',
      type: 'enum',
      label: 'Scope',
      default: 'global',
      options: [
        ['global', 'Whole document'],
        ['adjacent', 'Adjacent only']
      ]
    },
    {
      key: 'keep',
      type: 'enum',
      label: 'Keep',
      default: 'first',
      options: [
        ['first', 'First occurrence'],
        ['last', 'Last occurrence']
      ]
    },
    { key: 'caseInsensitive', type: 'bool', label: 'Case-insensitive', default: false },
    { key: 'addCounts', type: 'bool', label: 'Prefix with counts', default: false }
  ],
  describe(p) {
    return `Dedupe (${p.scope}, keep ${p.keep})`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const key = (l) => (p.caseInsensitive ? l.toLowerCase() : l);
      let result;

      if (p.scope === 'adjacent') {
        result = [];
        const counts = [];
        for (const line of lines) {
          const lastIndex = result.length - 1;
          if (lastIndex >= 0 && key(result[lastIndex]) === key(line)) {
            counts[lastIndex] += 1;
            if (p.keep === 'last') result[lastIndex] = line;
          } else {
            result.push(line);
            counts.push(1);
          }
        }
        if (p.addCounts) result = result.map((l, i) => `${counts[i]}\t${l}`);
      } else {
        const seen = new Map();
        for (const line of lines) {
          const k = key(line);
          if (!seen.has(k) || p.keep === 'last') {
            seen.set(k, { line, count: (seen.get(k)?.count || 0) + 1 });
          } else {
            seen.get(k).count += 1;
          }
        }
        result = [...seen.values()].map((v) => (p.addCounts ? `${v.count}\t${v.line}` : v.line));
      }

      return { ...d, text: result.join('\n') };
    });
  },
  examples: [
    {
      params: { scope: 'global', keep: 'first', caseInsensitive: false, addCounts: false },
      in: ['a\nb\na\nc'],
      out: ['a\nb\nc']
    },
    {
      params: { scope: 'global', keep: 'first', caseInsensitive: false, addCounts: false },
      in: [''],
      out: ['']
    }
  ]
};
