function qpEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let out = '';
  for (const b of bytes) {
    if ((b >= 33 && b <= 126 && b !== 61) || b === 32 || b === 9 || b === 10 || b === 13) out += String.fromCharCode(b);
    else out += `=${b.toString(16).toUpperCase().padStart(2, '0')}`;
  }
  return out;
}

function qpDecode(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '=' && /[0-9A-Fa-f]{2}/.test(str.slice(i + 1, i + 3))) {
      bytes.push(parseInt(str.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(str.charCodeAt(i));
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export default {
  id: 'code.quotedPrintable',
  name: 'Quoted-printable',
  group: 'Code',
  summary: 'Encode or decode quoted-printable (non-ASCII and = become =XX hex; line breaks pass through).',
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
    return `Quoted-printable ${p.mode}`;
  },
  run(docs, p) {
    const fn = p.mode === 'encode' ? qpEncode : qpDecode;
    return docs.map((d) => ({ ...d, text: fn(d.text) }));
  },
  examples: [
    { params: { mode: 'encode' }, in: ['caf\u00e9=100%'], out: ['caf=C3=A9=3D100%'] },
    { params: { mode: 'decode' }, in: ['caf=C3=A9=3D100%'], out: ['caf\u00e9=100%'] }
  ]
};
