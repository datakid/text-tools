export default {
  id: 'code.escapeJson',
  name: 'Escape/unescape JSON string',
  group: 'Code',
  summary: 'Escape text for embedding inside a JSON string literal, or unescape it back.',
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
    return `JSON string ${p.mode}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      let text;
      try {
        text = p.mode === 'encode' ? JSON.stringify(d.text).slice(1, -1) : JSON.parse(`"${d.text}"`);
      } catch (e) {
        text = d.text;
      }
      return { ...d, text };
    });
  },
  examples: [
    { params: { mode: 'encode' }, in: ['line one\n"quoted"'], out: ['line one\\n\\"quoted\\"'] },
    { params: { mode: 'decode' }, in: ['line one\\n\\"quoted\\"'], out: ['line one\n"quoted"'] }
  ]
};
