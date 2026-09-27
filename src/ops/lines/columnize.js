export default {
  id: 'lines.columnize',
  name: 'Columnize',
  group: 'Lines',
  summary: 'Reflow a flat list of lines into an aligned grid of N columns.',
  arity: 'map',
  previewFidelity: 'sample',
  cost: 'linear',
  params: [
    { key: 'columns', type: 'int', label: 'Columns', default: 2, min: 1 },
    {
      key: 'direction',
      type: 'enum',
      label: 'Fill order',
      default: 'down',
      options: [
        ['down', 'Down then across'],
        ['across', 'Across then down']
      ]
    },
    { key: 'separator', type: 'string', label: 'Separator', default: '  ' }
  ],
  describe(p) {
    return `Columnize into ${p.columns} columns`;
  },
  run(docs, p) {
    return docs.map((d) => {
      const lines = d.text.split(/\r\n|\r|\n/);
      const cols = Math.max(1, p.columns);
      const rowCount = Math.ceil(lines.length / cols) || 1;
      const grid = [];

      if (p.direction === 'down') {
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rowCount; r++) {
            const idx = c * rowCount + r;
            grid[r] = grid[r] || [];
            grid[r][c] = idx < lines.length ? lines[idx] : '';
          }
        }
      } else {
        for (let i = 0; i < lines.length; i++) {
          const r = Math.floor(i / cols);
          const c = i % cols;
          grid[r] = grid[r] || [];
          grid[r][c] = lines[i];
        }
      }

      const widths = [];
      for (const row of grid) {
        row.forEach((cell, c) => {
          widths[c] = Math.max(widths[c] || 0, (cell || '').length);
        });
      }

      const out = grid.map((row) =>
        row
          .map((cell, c) => (cell || '').padEnd(widths[c]))
          .join(p.separator)
          .replace(/\s+$/, '')
      );
      return { ...d, text: out.join('\n') };
    });
  },
  examples: [
    { params: { columns: 2, direction: 'down', separator: '  ' }, in: ['a\nb\nc\nd\ne'], out: ['a  d\nb  e\nc'] },
    { params: { columns: 3, direction: 'down', separator: '  ' }, in: ['x'], out: ['x'] }
  ]
};
