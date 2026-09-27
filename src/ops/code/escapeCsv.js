function escapeField(s) {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function unescapeField(s) {
  return s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1).replace(/""/g, '"') : s;
}

export default {
  id: 'code.escapeCsv',
  name: 'Escape/unescape CSV field',
  group: 'Code',
  summary: 'Treat each line as one CSV field: quote it if needed, or unquote it back.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Direction',
      default: 'encode',
      options: [
        ['encode', 'Encode'],
        ['decode', 'Decode']
      ]
    }
  ],
  describe(p) {
    return `CSV field ${p.mode}`;
  },
  run(docs, p) {
    const fn = p.mode === 'encode' ? escapeField : unescapeField;
    return docs.map((d) => ({ ...d, text: d.text.split(/\r\n|\r|\n/).map(fn).join('\n') }));
  },
  examples: [
    { params: { mode: 'encode' }, in: ['plain\nhas,comma\nhas"quote'], out: ['plain\n"has,comma"\n"has""quote"'] },
    { params: { mode: 'decode' }, in: ['plain\n"has,comma"\n"has""quote"'], out: ['plain\nhas,comma\nhas"quote'] }
  ]
};
