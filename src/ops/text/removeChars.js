const CLASSES = {
  digits: /\p{Nd}/gu,
  letters: /\p{L}/gu,
  punctuation: /[\p{P}\p{S}]/gu,
  nonAscii: /[^\x00-\x7F]/gu,
  emoji: /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu,
  invisible: /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\u00AD]/gu,
  control: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g
};

function escapeClass(s) {
  return s.replace(/[\\\]^-]/g, '\\$&');
}

export default {
  id: 'text.removeChars',
  name: 'Remove characters',
  group: 'Text',
  summary: 'Strip a class of characters: digits, letters, punctuation, emoji, non-ASCII, invisible/zero-width, control, or a custom set.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'kind',
      type: 'enum',
      label: 'Remove',
      default: 'invisible',
      options: [
        ['invisible', 'Invisible / zero-width'],
        ['control', 'Control characters'],
        ['emoji', 'Emoji'],
        ['nonAscii', 'Non-ASCII'],
        ['punctuation', 'Punctuation & symbols'],
        ['digits', 'Digits'],
        ['letters', 'Letters'],
        ['custom', 'Custom set']
      ]
    },
    { key: 'chars', type: 'string', label: 'Characters to remove', default: '', show: (p) => p.kind === 'custom' }
  ],
  describe(p) {
    return p.kind === 'custom' ? `Remove "${p.chars}"` : `Remove ${p.kind}`;
  },
  run(docs, p) {
    let re;
    if (p.kind === 'custom') {
      if (!p.chars) return docs;
      re = new RegExp(`[${escapeClass(p.chars)}]`, 'gu');
    } else {
      re = CLASSES[p.kind] || CLASSES.invisible;
    }
    return docs.map((d) => ({ ...d, text: d.text.replace(re, '') }));
  },
  examples: [
    { params: { kind: 'invisible' }, in: ['a\u200Bb\uFEFFc'], out: ['abc'] },
    { params: { kind: 'digits' }, in: ['a1b22c'], out: ['abc'] },
    { params: { kind: 'emoji' }, in: ['hi \ud83d\udc4b there \u2764\ufe0f'], out: ['hi  there '] },
    { params: { kind: 'custom', chars: '-]' }, in: ['a-b]c'], out: ['abc'] },
    { params: { kind: 'nonAscii' }, in: ['caf\u00e9'], out: ['caf'] }
  ]
};
