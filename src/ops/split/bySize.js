function findBoundary(text, pos, slack, boundary, pattern) {
  if (boundary === 'none' || slack <= 0) return pos;
  const lo = Math.max(0, pos - slack);
  const re =
    boundary === 'line'
      ? /\n/g
      : boundary === 'word'
        ? /\s/g
        : boundary === 'sentence'
          ? /[.!?]\s/g
          : boundary === 'paragraph'
            ? /\n\s*\n/g
            : boundary === 'regex' && pattern
              ? new RegExp(pattern, 'g')
              : null;
  if (!re) return pos;
  let best = -1;
  let m;
  re.lastIndex = lo;
  while ((m = re.exec(text))) {
    const end = m.index + m[0].length;
    if (end > pos) break;
    if (end >= lo) best = end;
    if (m[0].length === 0) re.lastIndex += 1;
  }
  return best >= 0 ? best : pos;
}

function chunkByChars(text, targetSize, boundary, pattern, slack, overlap) {
  const n = text.length;
  if (n === 0) return [''];
  const safeSize = Math.max(1, targetSize);
  const safeOverlap = Math.max(0, Math.min(overlap, safeSize - 1));
  const chunks = [];
  let start = 0;
  while (start < n) {
    let end = Math.min(n, start + safeSize);
    if (end < n) end = findBoundary(text, end, slack, boundary, pattern);
    if (end <= start) end = Math.min(n, start + safeSize);
    chunks.push(text.slice(start, end));
    if (end >= n) break;
    start = Math.max(end - safeOverlap, start + 1);
  }
  return chunks;
}

function chunkByLines(text, size, overlap) {
  const lines = text.split(/\r\n|\r|\n/);
  if (lines.length === 0) return [''];
  const safeSize = Math.max(1, size);
  const safeOverlap = Math.max(0, Math.min(overlap, safeSize - 1));
  const chunks = [];
  let start = 0;
  while (start < lines.length) {
    const end = Math.min(lines.length, start + safeSize);
    chunks.push(lines.slice(start, end).join('\n'));
    if (end >= lines.length) break;
    start = Math.max(end - safeOverlap, start + 1);
  }
  return chunks;
}

export default {
  id: 'split.bySize',
  name: 'Split by size',
  group: 'Split',
  summary: 'Cut each document into chunks of a target size, optionally snapped to a clean boundary.',
  arity: 'split',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    {
      key: 'unit',
      type: 'enum',
      label: 'Measure in',
      default: 'chars',
      options: [
        ['chars', 'Characters'],
        ['bytes', 'Bytes (approx.)'],
        ['lines', 'Lines'],
        ['tokens', 'Tokens (estimate)']
      ]
    },
    { key: 'size', type: 'int', label: 'Chunk size', min: 1, max: 1000000000, default: 1000 },
    {
      key: 'boundary',
      type: 'enum',
      label: 'Snap to',
      default: 'line',
      options: [
        ['none', 'Exact'],
        ['line', 'Line'],
        ['word', 'Word'],
        ['sentence', 'Sentence'],
        ['paragraph', 'Paragraph'],
        ['regex', 'Pattern\u2026']
      ],
      show: (p) => p.unit !== 'lines'
    },
    { key: 'pattern', type: 'regex', label: 'Boundary pattern', default: '', show: (p) => p.unit !== 'lines' && p.boundary === 'regex' },
    {
      key: 'slack',
      type: 'int',
      label: 'Boundary slack',
      default: 200,
      min: 0,
      help: 'How far past the target size to search for a clean break.',
      show: (p) => p.unit !== 'lines' && p.boundary !== 'none'
    },
    { key: 'overlap', type: 'int', label: 'Overlap', default: 0, min: 0 },
    {
      key: 'name',
      type: 'template',
      label: 'Chunk name',
      default: '{{base}}-{{i:pad3}}',
      tokens: ['{{base}}', '{{i}}', '{{n}}']
    }
  ],
  describe(p) {
    return `Split every ${p.size} ${p.unit}${p.overlap ? ` (${p.overlap} overlap)` : ''}`;
  },
  run(docs, p, ctx) {
    const out = [];
    const total = docs.length || 1;

    docs.forEach((d, di) => {
      const rawChunks =
        p.unit === 'lines'
          ? chunkByLines(d.text, p.size, p.overlap)
          : chunkByChars(d.text, p.unit === 'tokens' ? Math.max(1, Math.round(p.size * 4)) : p.size, p.boundary, p.pattern, p.slack, p.overlap);

      const n = rawChunks.length;
      rawChunks.forEach((text, i) => {
        const name = p.name
          .replace('{{base}}', d.name)
          .replace('{{i:pad3}}', String(i + 1).padStart(3, '0'))
          .replace('{{i}}', String(i + 1))
          .replace('{{n}}', String(n));
        out.push({ id: `${d.id}-${i}`, name, text, meta: { ...d.meta, parent: d.id, chunkIndex: i } });
      });
      ctx?.progress?.((di + 1) / total);
    });

    return out;
  },
  examples: [
    {
      params: { unit: 'chars', size: 3, boundary: 'none', pattern: '', slack: 0, overlap: 0, name: '{{base}}-{{i:pad3}}' },
      in: ['abcdefghij'],
      out: ['abc', 'def', 'ghi', 'j']
    },
    {
      params: { unit: 'chars', size: 4, boundary: 'word', pattern: '', slack: 2, overlap: 0, name: '{{base}}-{{i:pad3}}' },
      in: ['a b c d e f g h'],
      out: ['a b ', 'c d ', 'e f ', 'g h']
    },
    {
      params: { unit: 'chars', size: 5, boundary: 'none', pattern: '', slack: 0, overlap: 0, name: '{{base}}-{{i:pad3}}' },
      in: [''],
      out: ['']
    }
  ]
};
