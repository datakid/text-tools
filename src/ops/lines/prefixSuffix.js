export default {
  id: 'lines.prefixSuffix',
  name: 'Add prefix/suffix',
  group: 'Lines',
  summary: 'Add a prefix and/or suffix to every line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'prefix', type: 'template', label: 'Prefix', default: '' },
    { key: 'suffix', type: 'template', label: 'Suffix', default: '' }
  ],
  describe() {
    return 'Add prefix/suffix to each line';
  },
  run(docs, p) {
    return docs.map((d) => ({
      ...d,
      text: d.text
        .split(/\r\n|\r|\n/)
        .map((l) => `${p.prefix}${l}${p.suffix}`)
        .join('\n')
    }));
  },
  examples: [
    { params: { prefix: '[', suffix: ']' }, in: ['a\nb'], out: ['[a]\n[b]'] },
    { params: { prefix: '', suffix: ',' }, in: [''], out: [','] }
  ]
};
