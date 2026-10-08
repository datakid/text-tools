import { MANIFEST } from '../ops/index.js';

export const CATEGORIES = [
  { id: 'Text', label: 'Text', glyph: 'Aa', hue: 187, blurb: 'Case, Unicode, quotes, padding, wrapping' },
  { id: 'Whitespace', label: 'Whitespace', glyph: '\u2423', hue: 150, blurb: 'Trim, indent, tabs, blank lines' },
  { id: 'Lines', label: 'Lines', glyph: '\u2261', hue: 80, blurb: 'Sort, dedupe, filter, number, list' },
  { id: 'Find', label: 'Find & replace', glyph: '\u2315', hue: 32, blurb: 'Replace, highlight, count matches' },
  { id: 'Extract', label: 'Extract', glyph: '\u2913', hue: 305, blurb: 'Emails, URLs, numbers, columns, HTML' },
  { id: 'Data', label: 'JSON & CSV', glyph: '{ }', hue: 230, blurb: 'Format, validate, convert, reshape' },
  { id: 'Code', label: 'Encode', glyph: '</>', hue: 260, blurb: 'Base64, URL, HTML, hex, JWT, hashes' },
  { id: 'Split', label: 'Split', glyph: '\u2AFD', hue: 110, blurb: 'Cut one document into many' },
  { id: 'Merge', label: 'Merge', glyph: '\u2295', hue: 60, blurb: 'Join, zip, interleave documents' },
  { id: 'Gen', label: 'Generate', glyph: '\u2726', hue: 340, blurb: 'Sequences, UUIDs, lorem, lists' },
  { id: 'Analyze', label: 'Analyze', glyph: '\u2211', hue: 200, blurb: 'Stats, frequency, diff, regex test' },
  { id: 'Flow', label: 'Flow', glyph: '\u21BB', hue: 20, blurb: 'Select, rename, batch, assert, script' }
];

export const KEYWORDS = {
  'text.case': 'uppercase lowercase title camel snake kebab capitalize caps',
  'text.normalizeNewlines': 'crlf lf line endings windows unix eol',
  'text.normalizeUnicode': 'nfc nfd nfkc nfkd compose',
  'text.stripDiacritics': 'accents umlaut ascii fold',
  'text.reverse': 'backwards flip mirror',
  'text.pad': 'fill left right center width leading zeros',
  'text.truncate': 'shorten cut limit ellipsis max length',
  'text.wrap': 'word wrap line length column reflow hard soft',
  'text.slug': 'url permalink slugify kebab',
  'text.removeChars': 'strip delete zero width invisible emoji non ascii punctuation digits clean bom',
  'text.smartQuotes': 'curly typographic apostrophe dash ellipsis nbsp ascii word paste',
  'ws.trimLines': 'strip spaces whitespace',
  'ws.trimEdges': 'strip document start end',
  'ws.collapseSpaces': 'multiple spaces squeeze single',
  'ws.tabsToSpaces': 'expand tab indent',
  'ws.spacesToTabs': 'unexpand tab indent',
  'ws.stripTrailing': 'trailing spaces end of line',
  'ws.removeBlank': 'empty lines delete blank',
  'ws.squeezeBlankLines': 'consecutive blank collapse',
  'ws.indent': 'prefix quote > indentation',
  'ws.dedent': 'unindent outdent remove indentation',
  'lines.sort': 'order alphabetical ascending descending natural numeric',
  'lines.dedupe': 'unique duplicates distinct uniq remove duplicate',
  'lines.shuffle': 'random randomize order',
  'lines.number': 'line numbers enumerate count prefix',
  'lines.filter': 'grep keep remove contains matching exclude',
  'lines.slice': 'head tail first last range every nth',
  'lines.prefixSuffix': 'wrap each line add start end quote',
  'lines.columnize': 'grid columns layout',
  'lines.transpose': 'pivot rows columns flip',
  'lines.sample': 'random pick subset choose',
  'lines.align': 'table columns pad pretty tabular',
  'lines.toList': 'bullets numbered comma join sql in json array checklist markdown list',
  'lines.splitToLines': 'explode comma separated values one per line split list',
  'find.replace': 'substitute regex sed search',
  'find.replaceMany': 'batch replace table map translate',
  'find.highlight': 'mark wrap bold matches',
  'find.countMatches': 'occurrences tally how many',
  'split.byLines': 'chunk every n lines',
  'split.bySize': 'chunk characters bytes size',
  'split.byRegex': 'chunk pattern',
  'split.byBlankLine': 'paragraphs chunk',
  'split.byHeading': 'markdown sections chunk',
  'split.byDelimiterLine': 'separator --- chunk',
  'split.byCount': 'equal parts halves chunk',
  'split.byToken': 'llm gpt tokens chunk context',
  'merge.concat': 'combine join documents',
  'merge.interleave': 'alternate round robin',
  'merge.zipLines': 'side by side paste columns',
  'merge.joinLines': 'single line flatten unwrap join',
  'merge.reduceToTable': 'columns table tsv',
  'merge.wrapEach': 'header footer frame',
  'extract.byRegex': 'capture groups grep match',
  'extract.between': 'brackets delimiters inside',
  'extract.emails': 'email addresses mail',
  'extract.urls': 'links http https href',
  'extract.ips': 'ip address ipv4 network',
  'extract.numbers': 'digits integers decimals amounts',
  'extract.dates': 'iso calendar day',
  'extract.quoted': 'strings quotes',
  'extract.hashtags': 'tags social',
  'extract.keyValue': 'pairs config env ini',
  'extract.columns': 'cut fields csv awk',
  'extract.htmlText': 'strip tags plain text html',
  'extract.htmlAttr': 'href src attribute',
  'extract.markdownHeadings': 'toc outline headers',
  'extract.codeBlocks': 'fenced markdown code',
  'extract.jsonPath': 'json query jq field',
  'gen.repeat': 'template duplicate n times',
  'gen.sequence': 'numbers range count series',
  'gen.fromList': 'template list expand',
  'gen.product': 'combinations cartesian matrix',
  'gen.cycle': 'rotate values round robin',
  'gen.lorem': 'placeholder dummy filler',
  'gen.uuid': 'guid random id identifier',
  'code.base64': 'encode decode b64 btoa atob',
  'code.urlEncode': 'percent encoding uri escape query',
  'code.htmlEntities': 'escape amp lt gt',
  'code.escapeJson': 'string literal backslash',
  'code.escapeCsv': 'quote field',
  'code.escapeRegex': 'literal special characters',
  'code.hex': 'hexadecimal bytes',
  'code.rot13': 'cipher caesar',
  'code.quotedPrintable': 'email mime qp',
  'code.hash': 'sha256 checksum digest',
  'code.jwtDecode': 'jwt token bearer auth claims',
  'code.unicodeEscape': 'unicode \\u code point escape emoji',
  'data.jsonFormat': 'pretty print beautify indent json',
  'data.jsonMinify': 'compact compress json',
  'data.jsonSortKeys': 'order keys alphabetical canonical',
  'data.jsonFlatten': 'paths dot notation',
  'data.jsonToCsv': 'convert export spreadsheet',
  'data.csvToJson': 'convert import parse',
  'data.csvReshape': 'columns reorder select rename',
  'data.tsvSwap': 'tab comma delimiter convert',
  'data.toMarkdownTable': 'markdown table gfm',
  'data.jsonValidate': 'lint check parse error syntax jsonl',
  'analyze.stats': 'word count characters lines bytes count',
  'analyze.frequency': 'word frequency top words histogram',
  'analyze.diff': 'compare difference changes',
  'analyze.longestLines': 'long lines length',
  'analyze.encodingReport': 'bom line endings unicode',
  'analyze.regexTester': 'test pattern matches',
  'flow.select': 'pick filter documents',
  'flow.rename': 'filenames names',
  'flow.sortDocs': 'order documents',
  'flow.group': 'batch chunk documents',
  'flow.label': 'tag metadata',
  'flow.assert': 'check validate guard',
  'flow.script': 'javascript custom code function'
};

export const QUICK_ACTIONS = [
  { id: 'q-upper', label: 'UPPER', op: 'text.case', params: { mode: 'upper' } },
  { id: 'q-lower', label: 'lower', op: 'text.case', params: { mode: 'lower' } },
  { id: 'q-title', label: 'Title', op: 'text.case', params: { mode: 'title' } },
  { id: 'q-trim', label: 'Trim', op: 'ws.trimLines', params: { side: 'both' } },
  { id: 'q-blank', label: 'No blanks', op: 'ws.removeBlank', params: { whitespaceOnly: true } },
  { id: 'q-sort', label: 'Sort A\u2192Z', op: 'lines.sort', params: { mode: 'natural' } },
  { id: 'q-dedupe', label: 'Unique', op: 'lines.dedupe', params: { scope: 'global', keep: 'first' } },
  { id: 'q-number', label: 'Number', op: 'lines.number', params: {} },
  { id: 'q-join', label: 'Join', op: 'merge.joinLines', params: { separator: ', ' } },
  { id: 'q-split', label: 'Split ,', op: 'lines.splitToLines', params: { delimiter: 'comma' } },
  { id: 'q-json', label: 'JSON \u2728', op: 'data.jsonFormat', params: { indent: 2 } },
  { id: 'q-b64e', label: 'Base64', op: 'code.base64', params: { mode: 'encode' } },
  { id: 'q-urle', label: 'URL enc', op: 'code.urlEncode', params: { mode: 'encode' } },
  { id: 'q-clean', label: 'Clean paste', op: 'text.smartQuotes', params: { mode: 'straighten' } }
];

export const RECIPES = [
  {
    id: 'r-clean-list',
    name: 'Clean up a messy list',
    blurb: 'Trim, drop blanks, dedupe and sort naturally.',
    steps: [
      ['ws.trimLines', { side: 'both' }],
      ['ws.removeBlank', { whitespaceOnly: true }],
      ['lines.dedupe', { scope: 'global', keep: 'first', caseInsensitive: true }],
      ['lines.sort', { mode: 'natural', caseInsensitive: true }]
    ],
    sample: '  banana\napple\n\nBanana \ncherry\napple\n  file10\nfile2'
  },
  {
    id: 'r-emails',
    name: 'Pull unique emails',
    blurb: 'Extract every email address, lowercase and dedupe.',
    steps: [
      ['extract.emails', {}],
      ['text.case', { mode: 'lower' }],
      ['lines.dedupe', { scope: 'global', keep: 'first' }],
      ['lines.sort', { mode: 'lexical' }]
    ],
    sample: 'Contact Ada <ada@example.com> or BOB@Example.org.\nCC: ada@example.com, eve@test.io'
  },
  {
    id: 'r-sql-in',
    name: 'IDs to SQL IN (…)',
    blurb: 'Turn a pasted column of values into a SQL IN clause.',
    steps: [
      ['ws.trimLines', { side: 'both' }],
      ['lines.dedupe', { scope: 'global', keep: 'first' }],
      ['lines.toList', { format: 'sqlIn' }]
    ],
    sample: '1042\n1043\nO\'Brien\n1042\n'
  },
  {
    id: 'r-csv-md',
    name: 'CSV to aligned Markdown',
    blurb: 'Convert CSV rows into a Markdown table.',
    steps: [['data.toMarkdownTable', { delimiter: ',' }]],
    sample: 'name,role,joined\nAda,Engineer,2021\nGrace,Admiral,1943'
  },
  {
    id: 'r-word-freq',
    name: 'Top words',
    blurb: 'Word frequency without stopwords, top 20.',
    steps: [
      ['analyze.frequency', { unit: 'word', stopwords: true, caseInsensitive: true }],
      ['lines.slice', { mode: 'head', count: 20 }],
      ['lines.align', { delimiter: '\t', gap: '  ', quoted: false }]
    ],
    sample: 'The quick brown fox jumps over the lazy dog. The dog sleeps. The fox runs.'
  },
  {
    id: 'r-llm-chunks',
    name: 'Chunk for an LLM',
    blurb: 'Normalize whitespace, then split into ~500-token chunks.',
    steps: [
      ['text.normalizeNewlines', { to: 'lf' }],
      ['ws.squeezeBlankLines', { max: 1 }],
      ['split.byToken', { tokensPerChunk: 500, overlapTokens: 50 }]
    ],
    sample: ''
  },
  {
    id: 'r-paste-clean',
    name: 'Clean pasted prose',
    blurb: 'Straighten quotes, remove invisible characters, collapse spaces.',
    steps: [
      ['text.smartQuotes', { mode: 'straighten' }],
      ['text.removeChars', { kind: 'invisible' }],
      ['ws.collapseSpaces', { collapseTabs: true }],
      ['ws.stripTrailing', {}]
    ],
    sample: '\u201CIt\u2019s  fine,\u201D she said\u200B \u2014 really\u2026   '
  },
  {
    id: 'r-jwt',
    name: 'Inspect a JWT',
    blurb: 'Decode header and payload with readable times.',
    steps: [['code.jwtDecode', { part: 'both' }]],
    sample: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6IkFkYSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzk5OTk5OTk5fQ.signature'
  }
];

export function categoryOf(group) {
  return CATEGORIES.find((c) => c.id === group) || { id: group, label: group, glyph: '\u2022', hue: 187, blurb: '' };
}

export function entriesByCategory() {
  const map = new Map(CATEGORIES.map((c) => [c.id, []]));
  for (const entry of MANIFEST) {
    if (!map.has(entry.group)) map.set(entry.group, []);
    map.get(entry.group).push(entry);
  }
  return map;
}

function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function subsequence(needle, hay) {
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) if (hay[j] === needle[i]) i++;
  return i === needle.length;
}

export function scoreEntry(entry, query) {
  const q = normalize(query).trim();
  if (!q) return 1;
  const name = normalize(entry.name);
  const cat = normalize(categoryOf(entry.group).label);
  const kw = normalize(KEYWORDS[entry.id] || '');
  const id = normalize(entry.id);
  const words = q.split(/\s+/).filter(Boolean);
  let total = 0;
  for (const w of words) {
    let s = 0;
    if (name === w) s = 120;
    else if (name.startsWith(w)) s = 90;
    else if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(name)) s = 75;
    else if (name.includes(w)) s = 55;
    else if (kw.split(/\s+/).some((k) => k.startsWith(w))) s = 45;
    else if (kw.includes(w) || id.includes(w)) s = 30;
    else if (cat.includes(w)) s = 20;
    else if (w.length >= 3 && subsequence(w, name)) s = 10;
    if (!s) return 0;
    total += s;
  }
  return total;
}

export function searchEntries(query, { limit = 200 } = {}) {
  const scored = [];
  for (const entry of MANIFEST) {
    const s = scoreEntry(entry, query);
    if (s > 0) scored.push({ entry, score: s });
  }
  scored.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
  return scored.slice(0, limit).map((x) => x.entry);
}

export function searchRecipes(query) {
  const q = normalize(query).trim();
  if (!q) return RECIPES.slice();
  return RECIPES.filter((r) => normalize(`${r.name} ${r.blurb}`).includes(q) || q.split(/\s+/).every((w) => normalize(`${r.name} ${r.blurb}`).includes(w)));
}
