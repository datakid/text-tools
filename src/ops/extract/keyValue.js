export default {
  id: 'extract.keyValue',
  name: 'Extract key/value pairs',
  group: 'Extract',
  summary: 'Extract key:value or key=value pairs from each line, dropping lines with no separator.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'separatorPattern', type: 'regex', label: 'Separator pattern', default: '\\s*[:=]\\s*' },
    { key: 'outputSeparator', type: 'string', label: 'Output separator', default: '\t' }
  ],
  describe() {
    return 'Extract key/value pairs';
  },
  run(docs, p) {
    const re = new RegExp(p.separatorPattern);
    return docs.map((d) => {
      const rows = d.text
        .split(/\r\n|\r|\n/)
        .map((line) => {
          const idx = line.search(re);
          if (idx === -1) return null;
          const m = line.match(re);
          return `${line.slice(0, idx)}${p.outputSeparator}${line.slice(idx + m[0].length)}`;
        })
        .filter((r) => r !== null);
      return { ...d, text: rows.join('\n') };
    });
  },
  examples: [
    {
      params: { separatorPattern: '\\s*[:=]\\s*', outputSeparator: '\t' },
      in: ['name: Alice\nage=30\nnotapair'],
      out: ['name\tAlice\nage\t30']
    },
    { params: { separatorPattern: '\\s*[:=]\\s*', outputSeparator: '\t' }, in: [''], out: [''] }
  ]
};
