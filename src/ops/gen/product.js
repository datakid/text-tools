export default {
  id: 'gen.product',
  name: 'Cartesian product',
  group: 'Gen',
  summary: 'Generate one document per combination across 2\u20134 lists (a cartesian product).',
  arity: 'split',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    { key: 'listA', type: 'template', label: 'List A (one per line)', default: 'a\nb' },
    { key: 'listB', type: 'template', label: 'List B (one per line)', default: '1\n2' },
    { key: 'listC', type: 'template', label: 'List C (optional)', default: '' },
    { key: 'listD', type: 'template', label: 'List D (optional)', default: '' },
    { key: 'template', type: 'template', label: 'Template', default: '{{a}}-{{b}}', tokens: ['{{a}}', '{{b}}', '{{c}}', '{{d}}'] }
  ],
  describe() {
    return 'Cartesian product';
  },
  run(docs, p) {
    const parse = (s) => s.split(/\r\n|\r|\n/).filter((l) => l !== '');
    const lists = [parse(p.listA), parse(p.listB), parse(p.listC), parse(p.listD)].filter((l) => l.length > 0);
    if (lists.length === 0) return [];

    let combos = [[]];
    for (const list of lists) {
      const next = [];
      for (const combo of combos) {
        for (const item of list) next.push([...combo, item]);
      }
      combos = next;
    }

    const keys = ['a', 'b', 'c', 'd'];
    return combos.map((combo, i) => {
      let text = p.template;
      combo.forEach((val, idx) => {
        text = text.replace(new RegExp(`\\{\\{${keys[idx]}\\}\\}`, 'g'), val);
      });
      return { id: `gen-${i}`, name: text, text, meta: {} };
    });
  },
  examples: [
    {
      params: { listA: 'a\nb', listB: '1\n2', listC: '', listD: '', template: '{{a}}-{{b}}' },
      in: [''],
      out: ['a-1', 'a-2', 'b-1', 'b-2']
    },
    { params: { listA: '', listB: '', listC: '', listD: '', template: '{{a}}-{{b}}' }, in: [''], out: [] }
  ]
};
