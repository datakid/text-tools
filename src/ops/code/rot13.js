function rot13(s) {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export default {
  id: 'code.rot13',
  name: 'ROT13',
  group: 'Code',
  summary: 'Apply the ROT13 letter-substitution cipher (its own inverse).',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'ROT13';
  },
  run(docs) {
    return docs.map((d) => ({ ...d, text: rot13(d.text) }));
  },
  examples: [
    { params: {}, in: ['Hello, World!'], out: ['Uryyb, Jbeyq!'] },
    { params: {}, in: ['Uryyb, Jbeyq!'], out: ['Hello, World!'] }
  ]
};
