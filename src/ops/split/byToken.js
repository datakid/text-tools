export default {
  id: 'split.byToken',
  name: 'Split by token (estimate)',
  group: 'Split',
  summary: 'Chunk text by an approximate token count (~4 characters per token) \u2014 an estimate, not an exact tokenizer.',
  arity: 'split',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    { key: 'tokensPerChunk', type: 'int', label: 'Tokens per chunk', default: 500, min: 1 },
    { key: 'overlapTokens', type: 'int', label: 'Overlap (tokens)', default: 0, min: 0 },
    {
      key: 'name',
      type: 'template',
      label: 'Chunk name',
      default: '{{base}}-{{i:pad3}}',
      tokens: ['{{base}}', '{{i}}', '{{n}}']
    }
  ],
  describe(p) {
    return `Split every ~${p.tokensPerChunk} tokens (estimate)`;
  },
  run(docs, p) {
    const charsPerChunk = Math.max(1, Math.round(p.tokensPerChunk * 4));
    const overlapChars = Math.max(0, Math.min(Math.round(p.overlapTokens * 4), charsPerChunk - 1));
    const out = [];

    docs.forEach((d) => {
      const text = d.text;
      const chunks = [];
      if (text.length === 0) chunks.push('');
      let start = 0;
      while (start < text.length) {
        const end = Math.min(text.length, start + charsPerChunk);
        chunks.push(text.slice(start, end));
        if (end >= text.length) break;
        start = Math.max(end - overlapChars, start + 1);
      }

      const n = chunks.length;
      chunks.forEach((chunkText, i) => {
        const name = p.name
          .replace('{{base}}', d.name)
          .replace('{{i:pad3}}', String(i + 1).padStart(3, '0'))
          .replace('{{i}}', String(i + 1))
          .replace('{{n}}', String(n));
        out.push({
          id: `${d.id}-${i}`,
          name,
          text: chunkText,
          meta: { ...d.meta, parent: d.id, chunkIndex: i, estimatedTokens: Math.ceil(chunkText.length / 4) }
        });
      });
    });

    return out;
  },
  examples: [
    {
      params: { tokensPerChunk: 2, overlapTokens: 0, name: '{{base}}-{{i:pad3}}' },
      in: ['abcdefghijklmnop'],
      out: ['abcdefgh', 'ijklmnop']
    },
    { params: { tokensPerChunk: 1, overlapTokens: 0, name: '{{base}}-{{i:pad3}}' }, in: [''], out: [''] }
  ]
};
