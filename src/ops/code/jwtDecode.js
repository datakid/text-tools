function b64urlDecode(part) {
  let s = part.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function describeTime(value) {
  if (typeof value !== 'number') return null;
  return new Date(value * 1000).toISOString();
}

export default {
  id: 'code.jwtDecode',
  name: 'Decode JWT',
  group: 'Code',
  summary: 'Decode a JSON Web Token into its header and payload (signature is not verified). Expiry times are shown as ISO dates.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'part', type: 'enum', label: 'Show', default: 'both', options: [['both', 'Header and payload'], ['payload', 'Payload only'], ['header', 'Header only']] }],
  describe() {
    return 'Decode JWT';
  },
  run(docs, p) {
    return docs.map((d) => {
      const token = d.text.trim().replace(/^Bearer\s+/i, '');
      const parts = token.split('.');
      if (parts.length < 2) return { ...d, text: 'Not a JWT: expected header.payload.signature' };
      try {
        const header = JSON.parse(b64urlDecode(parts[0]));
        const payload = JSON.parse(b64urlDecode(parts[1]));
        const times = {};
        for (const k of ['iat', 'nbf', 'exp']) {
          const iso = describeTime(payload[k]);
          if (iso) times[k] = iso;
        }
        const out = {};
        if (p.part !== 'payload') out.header = header;
        if (p.part !== 'header') {
          out.payload = payload;
          if (Object.keys(times).length) out.times = times;
        }
        const value = p.part === 'both' ? out : p.part === 'payload' ? payload : header;
        return { ...d, text: JSON.stringify(value, null, 2) };
      } catch (e) {
        return { ...d, text: `Could not decode JWT: ${e.message}` };
      }
    });
  },
  examples: [
    {
      params: { part: 'payload' },
      in: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhIn0.sig'],
      out: ['{\n  "sub": "123",\n  "name": "Ada"\n}']
    },
    { params: { part: 'both' }, in: ['not-a-token'], out: ['Not a JWT: expected header.payload.signature'] }
  ]
};
