export default {
  id: 'code.urlEncode',
  name: 'URL encode/decode',
  group: 'Code',
  summary: 'Encode or decode URI components.',
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
    },
    { key: 'component', type: 'bool', label: 'Escape reserved characters (& = ? /)', default: true }
  ],
  describe(p) {
    return `URL ${p.mode}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      let text;
      try {
        if (p.mode === 'encode') text = p.component ? encodeURIComponent(d.text) : encodeURI(d.text);
        else text = p.component ? decodeURIComponent(d.text) : decodeURI(d.text);
      } catch (e) {
        text = d.text;
      }
      return { ...d, text };
    });
  },
  examples: [
    { params: { mode: 'encode', component: true }, in: ['a b&c=d'], out: ['a%20b%26c%3Dd'] },
    { params: { mode: 'decode', component: true }, in: ['a%20b%26c%3Dd'], out: ['a b&c=d'] }
  ]
};
