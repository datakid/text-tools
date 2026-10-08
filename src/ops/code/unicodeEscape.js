function encode(s, style) {
  let out = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp < 128) {
      out += ch;
    } else if (style === 'codepoint') {
      out += `\\u{${cp.toString(16).toUpperCase()}}`;
    } else if (style === 'html') {
      out += `&#x${cp.toString(16).toUpperCase()};`;
    } else {
      for (let i = 0; i < ch.length; i++) out += `\\u${ch.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')}`;
    }
  }
  return out;
}

function decode(s) {
  return s
    .replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#x([0-9a-fA-F]{1,6});/g, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d{1,7});/g, (m, n) => String.fromCodePoint(parseInt(n, 10)));
}

export default {
  id: 'code.unicodeEscape',
  name: 'Unicode escape',
  group: 'Code',
  summary: 'Escape non-ASCII characters as \\uXXXX, \\u{…} or &#x…; references, or decode them back.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'mode', type: 'enum', label: 'Direction', default: 'encode', options: [['encode', 'Encode'], ['decode', 'Decode']] },
    {
      key: 'style',
      type: 'enum',
      label: 'Style',
      default: 'js',
      options: [['js', '\\uXXXX (JS/JSON)'], ['codepoint', '\\u{…} (ES6)'], ['html', '&#x…; (HTML)']],
      show: (p) => p.mode === 'encode'
    }
  ],
  describe(p) {
    return `Unicode ${p.mode}`;
  },
  run(docs, p) {
    return docs.map((d) => ({ ...d, text: p.mode === 'encode' ? encode(d.text, p.style) : decode(d.text) }));
  },
  examples: [
    { params: { mode: 'encode', style: 'js' }, in: ['caf\u00e9 \ud83d\ude00'], out: ['caf\\u00E9 \\uD83D\\uDE00'] },
    { params: { mode: 'encode', style: 'codepoint' }, in: ['\ud83d\ude00'], out: ['\\u{1F600}'] },
    { params: { mode: 'decode', style: 'js' }, in: ['caf\\u00E9 &#x1F600; &#65;'], out: ['caf\u00e9 \ud83d\ude00 A'] }
  ]
};
