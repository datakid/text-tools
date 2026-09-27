export default {
  id: 'extract.htmlAttr',
  name: 'Extract HTML attribute',
  group: 'Extract',
  summary: 'Extract an attribute value from tags matching a tag name (regex-based, not a full parser).',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'tag', type: 'string', label: 'Tag name (or * for any)', default: 'a' },
    { key: 'attribute', type: 'string', label: 'Attribute', default: 'href' }
  ],
  describe(p) {
    return `Extract ${p.attribute} from <${p.tag}>`;
  },
  run(docs, p) {
    const tagPattern = p.tag === '*' ? '[a-zA-Z][a-zA-Z0-9]*' : p.tag;
    const re = new RegExp(`<${tagPattern}\\b[^>]*?\\s${p.attribute}=["']([^"']*)["'][^>]*>`, 'gi');
    return docs.map((d) => {
      const rows = [];
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(d.text))) {
        rows.push(m[1]);
        if (m[0].length === 0) re.lastIndex += 1;
      }
      return { ...d, text: rows.join('\n') };
    });
  },
  examples: [
    {
      params: { tag: 'a', attribute: 'href' },
      in: ['<a href="https://x.com">x</a> <a href="https://y.com">y</a>'],
      out: ['https://x.com\nhttps://y.com']
    },
    { params: { tag: 'img', attribute: 'src' }, in: ['<p>no images</p>'], out: [''] }
  ]
};
