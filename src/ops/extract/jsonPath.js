function getPath(obj, path) {
  const tokens = path
    .replace(/^\$\.?/, '')
    .split(/\.|\[(\d+)\]/)
    .filter((t) => t !== undefined && t !== '');
  let cur = obj;
  for (const t of tokens) {
    if (cur == null) return undefined;
    cur = cur[/^\d+$/.test(t) ? Number(t) : t];
  }
  return cur;
}

export default {
  id: 'extract.jsonPath',
  name: 'Extract by JSON path',
  group: 'Extract',
  summary: 'Parse the document as JSON and extract a value at a simple path, e.g. $.items[0].name.',
  arity: 'map',
  previewFidelity: 'none',
  cost: 'linear',
  params: [{ key: 'path', type: 'string', label: 'Path', default: '$' }],
  describe(p) {
    return `Extract ${p.path}`;
  },
  run(docs, p) {
    return docs.map((d) => {
      let text;
      try {
        const value = getPath(JSON.parse(d.text), p.path);
        text = value === undefined ? '' : typeof value === 'string' ? value : JSON.stringify(value);
      } catch (e) {
        text = '';
      }
      return { ...d, text };
    });
  },
  examples: [
    { params: { path: '$.items[1].name' }, in: ['{"items":[{"name":"a"},{"name":"b"}]}'], out: ['b'] },
    { params: { path: '$.missing' }, in: ['{}'], out: [''] }
  ]
};
