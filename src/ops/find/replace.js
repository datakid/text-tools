function escapeForLiteral(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRegex(pattern, flags, wholeWord) {
  const source = wholeWord ? `\\b(?:${pattern})\\b` : pattern;
  return new RegExp(source, flags);
}

export default {
  id: 'find.replace',
  name: 'Find & replace',
  group: 'Find',
  summary: 'Replace matches of a literal string, whole word, or regular expression.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Match',
      default: 'literal',
      options: [
        ['literal', 'Literal'],
        ['word', 'Whole word'],
        ['regex', 'Regular expression']
      ]
    },
    { key: 'find', type: 'string', label: 'Find', default: '' },
    { key: 'replaceWith', type: 'template', label: 'Replace with', default: '' },
    { key: 'caseSensitive', type: 'bool', label: 'Case-sensitive', default: true },
    { key: 'global', type: 'bool', label: 'Replace all', default: true },
    {
      key: 'nth',
      type: 'int',
      label: 'Only nth match',
      default: 0,
      min: 0,
      help: '0 replaces the first match only',
      show: (p) => !p.global
    }
  ],
  describe(p) {
    return p.mode === 'regex' ? 'Replace pattern' : `Replace "${p.find}"`;
  },
  run(docs, p) {
    if (!p.find) return docs;
    const flags = `${p.caseSensitive ? '' : 'i'}g`;
    const pattern = p.mode === 'regex' ? p.find : escapeForLiteral(p.find);
    const re = buildRegex(pattern, flags, p.mode === 'word');
    return docs.map((d) => {
      let count = 0;
      const text = d.text.replace(re, (match, ...rest) => {
        count += 1;
        const groups = rest.slice(0, -2);
        if (!p.global) {
          if (p.nth > 0 && count !== p.nth) return match;
          if (p.nth === 0 && count > 1) return match;
        }
        return p.replaceWith.replace(/\$(\d+)|\$\$/g, (m, g) => {
          if (m === '$$') return '$';
          const idx = parseInt(g, 10) - 1;
          return groups[idx] !== undefined ? groups[idx] : '';
        });
      });
      return { ...d, text };
    });
  },
  examples: [
    {
      params: { mode: 'literal', find: 'foo', replaceWith: 'bar', caseSensitive: true, global: true, nth: 0 },
      in: ['foo foo'],
      out: ['bar bar']
    },
    {
      params: { mode: 'literal', find: 'xyz', replaceWith: 'bar', caseSensitive: true, global: true, nth: 0 },
      in: ['no match here'],
      out: ['no match here']
    }
  ]
};
