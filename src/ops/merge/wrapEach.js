export default {
  id: 'merge.wrapEach',
  name: 'Wrap each document',
  group: 'Merge',
  summary: 'Wrap each document individually with a header and/or footer template.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'header', type: 'template', label: 'Header', default: '', tokens: ['{{name}}', '{{i}}', '{{n}}'] },
    { key: 'footer', type: 'template', label: 'Footer', default: '', tokens: ['{{name}}', '{{i}}', '{{n}}'] }
  ],
  describe() {
    return 'Wrap each document';
  },
  run(docs, p) {
    const n = docs.length;
    return docs.map((d, i) => {
      const fill = (t) => t.replace('{{name}}', d.name).replace('{{i}}', String(i + 1)).replace('{{n}}', String(n));
      const parts = [fill(p.header), d.text, fill(p.footer)].filter((s) => s !== '');
      return { ...d, text: parts.join('\n') };
    });
  },
  examples: [
    { params: { header: '=== {{name}} ===', footer: '' }, in: ['hello'], out: ['=== doc_0 ===\nhello'] },
    { params: { header: '', footer: '' }, in: ['unchanged'], out: ['unchanged'] }
  ]
};
