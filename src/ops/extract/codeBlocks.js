export default {
  id: 'extract.codeBlocks',
  name: 'Extract code blocks',
  group: 'Extract',
  summary: 'Extract the contents of fenced Markdown code blocks, optionally filtered by language.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [{ key: 'language', type: 'string', label: 'Language filter (blank = any)', default: '' }],
  describe(p) {
    return p.language ? `Extract \`${p.language}\` code blocks` : 'Extract code blocks';
  },
  run(docs, p) {
    const re = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;
    return docs.map((d) => {
      const blocks = [];
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(d.text))) {
        if (!p.language || m[1].toLowerCase() === p.language.toLowerCase()) blocks.push(m[2].replace(/\n$/, ''));
      }
      return { ...d, text: blocks.join('\n\n---\n\n') };
    });
  },
  examples: [
    { params: { language: '' }, in: ['text\n```js\nconsole.log(1)\n```\nmore'], out: ['console.log(1)'] },
    { params: { language: 'python' }, in: ['```js\nx=1\n```'], out: [''] }
  ]
};
