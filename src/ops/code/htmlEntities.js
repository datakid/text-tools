function encode(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export default {
  id: 'code.htmlEntities',
  name: 'HTML entities',
  group: 'Code',
  summary: 'Encode or decode HTML entities (&amp; &lt; &gt; &quot; &#39;).',
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
    return `HTML entities ${p.mode}`;
  },
  run(docs, p) {
    const fn = p.mode === 'encode' ? encode : decode;
    return docs.map((d) => ({ ...d, text: fn(d.text) }));
  },
  examples: [
    { params: { mode: 'encode' }, in: ['<b>Tom & Jerry</b>'], out: ['&lt;b&gt;Tom &amp; Jerry&lt;/b&gt;'] },
    { params: { mode: 'decode' }, in: ['&lt;b&gt;Tom &amp; Jerry&lt;/b&gt;'], out: ['<b>Tom & Jerry</b>'] }
  ]
};
