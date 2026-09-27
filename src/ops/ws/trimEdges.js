export default {
  id: 'ws.trimEdges',
  name: 'Trim document edges',
  group: 'Whitespace',
  summary: 'Trim leading and/or trailing whitespace from the whole document, not each line.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'side',
      type: 'enum',
      label: 'Trim',
      default: 'both',
      options: [
        ['both', 'Both ends'],
        ['start', 'Start only'],
        ['end', 'End only']
      ]
    }
  ],
  describe(p) {
    return p.side === 'both' ? 'Trim both ends of the document' : `Trim the ${p.side} of the document`;
  },
  run(docs, p) {
    return docs.map((d) => {
      let text = d.text;
      if (p.side === 'both') text = text.trim();
      else if (p.side === 'start') text = text.replace(/^\s+/, '');
      else text = text.replace(/\s+$/, '');
      return { ...d, text };
    });
  },
  examples: [
    { params: { side: 'both' }, in: ['\r\n  hello \r\n\r\n'], out: ['hello'] },
    { params: { side: 'both' }, in: [''], out: [''] }
  ]
};
