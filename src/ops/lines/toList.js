const FORMATS = {
  bullets: (items) => items.map((s) => `- ${s}`).join('\n'),
  numbered: (items) => items.map((s, i) => `${i + 1}. ${s}`).join('\n'),
  checklist: (items) => items.map((s) => `- [ ] ${s}`).join('\n'),
  comma: (items) => items.join(', '),
  sqlIn: (items) => `(${items.map((s) => (/^-?\d+(\.\d+)?$/.test(s) ? s : `'${s.replace(/'/g, "''")}'`)).join(', ')})`,
  jsonArray: (items) => JSON.stringify(items),
  quoted: (items) => items.map((s) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(', '),
  html: (items) => `<ul>\n${items.map((s) => `  <li>${s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('\n')}\n</ul>`,
  sentence: (items) => (items.length <= 2 ? items.join(' and ') : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`)
};

export default {
  id: 'lines.toList',
  name: 'Lines to list',
  group: 'Lines',
  summary: 'Turn lines into a bulleted, numbered, comma-separated, SQL IN (…), JSON array, HTML or plain-English list.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'format',
      type: 'enum',
      label: 'Format',
      default: 'bullets',
      options: [
        ['bullets', '- Bullets'],
        ['numbered', '1. Numbered'],
        ['checklist', '- [ ] Checklist'],
        ['comma', 'a, b, c'],
        ['quoted', '"a", "b", "c"'],
        ['sqlIn', "SQL IN ('a', 'b')"],
        ['jsonArray', 'JSON array'],
        ['html', 'HTML <ul>'],
        ['sentence', 'a, b, and c']
      ]
    },
    { key: 'skipBlank', type: 'bool', label: 'Skip blank lines', default: true },
    { key: 'trim', type: 'bool', label: 'Trim each item', default: true }
  ],
  describe(p) {
    return `Lines to ${p.format} list`;
  },
  run(docs, p) {
    const fn = FORMATS[p.format] || FORMATS.bullets;
    return docs.map((d) => {
      let items = d.text.split(/\r\n|\r|\n/);
      if (p.trim) items = items.map((s) => s.trim());
      if (p.skipBlank) items = items.filter((s) => s !== '');
      return { ...d, text: fn(items) };
    });
  },
  examples: [
    { params: { format: 'sqlIn', skipBlank: true, trim: true }, in: [" a \n\nb'c\n42"], out: ["('a', 'b''c', 42)"] },
    { params: { format: 'jsonArray', skipBlank: true, trim: true }, in: ['x\ny'], out: ['["x","y"]'] },
    { params: { format: 'sentence', skipBlank: true, trim: true }, in: ['red\ngreen\nblue'], out: ['red, green, and blue'] },
    { params: { format: 'numbered', skipBlank: true, trim: true }, in: [''], out: [''] }
  ]
};
