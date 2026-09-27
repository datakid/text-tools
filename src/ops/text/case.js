function toTitle(s) {
  return s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
}

function toSentence(s) {
  return s.replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase());
}

function splitWords(s) {
  return s.trim().split(/[^a-zA-Z0-9]+/).filter(Boolean);
}

function toCamel(s) {
  return splitWords(s)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

function toPascal(s) {
  return splitWords(s).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function toSnake(s) {
  return splitWords(s).map((w) => w.toLowerCase()).join('_');
}

function toKebab(s) {
  return splitWords(s).map((w) => w.toLowerCase()).join('-');
}

function toConstant(s) {
  return toSnake(s).toUpperCase();
}

function toSwap(s) {
  return [...s].map((ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())).join('');
}

const TRANSFORMS = {
  upper: (s) => s.toUpperCase(),
  lower: (s) => s.toLowerCase(),
  title: toTitle,
  sentence: toSentence,
  camel: toCamel,
  pascal: toPascal,
  snake: toSnake,
  kebab: toKebab,
  constant: toConstant,
  swap: toSwap
};

export default {
  id: 'text.case',
  name: 'Change case',
  group: 'Text',
  summary: 'Convert text to upper, lower, title, camel, snake, and other cases.',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [
    {
      key: 'mode',
      type: 'enum',
      label: 'Case',
      default: 'upper',
      options: [
        ['upper', 'UPPER CASE'],
        ['lower', 'lower case'],
        ['title', 'Title Case'],
        ['sentence', 'Sentence case'],
        ['camel', 'camelCase'],
        ['pascal', 'PascalCase'],
        ['snake', 'snake_case'],
        ['kebab', 'kebab-case'],
        ['constant', 'CONSTANT_CASE'],
        ['swap', 'sWAP cASE']
      ]
    }
  ],
  describe(p) {
    return `Convert to ${p.mode}`;
  },
  run(docs, p) {
    const fn = TRANSFORMS[p.mode] || TRANSFORMS.upper;
    return docs.map((d) => ({ ...d, text: fn(d.text) }));
  },
  examples: [
    { params: { mode: 'upper' }, in: ['abc'], out: ['ABC'] },
    { params: { mode: 'kebab' }, in: ['Hello World'], out: ['hello-world'] },
    { params: { mode: 'upper' }, in: [''], out: [''] }
  ]
};
