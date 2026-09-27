function toHex(str) {
  const bytes = new TextEncoder().encode(str);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(str) {
  const clean = str.replace(/\s+/g, '');
  const bytes = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return new TextDecoder().decode(bytes);
}

export default {
  id: 'code.hex',
  name: 'Hex',
  group: 'Code',
  summary: 'Encode or decode a hexadecimal (UTF-8 byte) representation.',
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
    return `Hex ${p.mode}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      let text;
      try {
        text = p.mode === 'encode' ? toHex(d.text) : fromHex(d.text);
      } catch (e) {
        text = '';
      }
      return { ...d, text };
    });
  },
  examples: [
    { params: { mode: 'encode' }, in: ['AB'], out: ['4142'] },
    { params: { mode: 'decode' }, in: ['4142'], out: ['AB'] }
  ]
};
