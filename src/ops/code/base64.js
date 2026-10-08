function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(str) {
  let clean = str.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (clean.length % 4) clean += '=';
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export default {
  id: 'code.base64',
  name: 'Base64',
  group: 'Code',
  summary: 'Encode or decode Base64, UTF-8 safe.',
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
    return `Base64 ${p.mode}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      let text;
      try {
        text = p.mode === 'encode' ? toBase64(d.text) : fromBase64(d.text);
      } catch (e) {
        text = d.text;
      }
      return { ...d, text };
    });
  },
  examples: [
    { params: { mode: 'encode' }, in: ['caf\u00e9'], out: ['Y2Fmw6k='] },
    { params: { mode: 'decode' }, in: ['Y2Fmw6k='], out: ['caf\u00e9'] },
    { params: { mode: 'decode' }, in: ['Y2Fm\nw6k'], out: ['caf\u00e9'] },
    { params: { mode: 'decode' }, in: ['PDw_Pz4-'], out: ['<<??>>'] }
  ]
};
