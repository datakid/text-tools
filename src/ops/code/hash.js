async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  id: 'code.hash',
  name: 'Hash (SHA-256)',
  group: 'Code',
  summary: 'Compute the SHA-256 hash of each document, hex-encoded.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'linear',
  params: [],
  describe() {
    return 'SHA-256 hash';
  },
  async run(docs) {
    const out = [];
    for (const d of docs) out.push({ ...d, text: await sha256Hex(d.text) });
    return out;
  },
  examples: [
    { params: {}, in: [''], out: ['e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'] },
    { params: {}, in: ['hello'], out: ['2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'] }
  ]
};
