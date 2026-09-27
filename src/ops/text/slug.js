export default {
  id: 'text.slug',
  name: 'Slugify',
  group: 'Text',
  summary: 'Convert text into a URL-friendly slug.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'separator', type: 'string', label: 'Separator', default: '-' },
    { key: 'lowercase', type: 'bool', label: 'Lowercase', default: true }
  ],
  describe(p) {
    return `Slugify (sep "${p.separator}")`;
  },
  run(docs, p) {
    return docs.map((d) => {
      let text = d.text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (p.lowercase) text = text.toLowerCase();
      text = text.replace(/[^a-zA-Z0-9]+/g, p.separator);
      const esc = p.separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (esc) text = text.replace(new RegExp(`^${esc}+|${esc}+$`, 'g'), '');
      return { ...d, text };
    });
  },
  examples: [
    { params: { separator: '-', lowercase: true }, in: ['Caf\u00e9 Society!'], out: ['cafe-society'] },
    { params: { separator: '-', lowercase: true }, in: [''], out: [''] }
  ]
};
