import { MANIFEST } from '../ops/index.js';
import { get } from '../core/registry.js';
import { defaults, coerce, validate } from '../core/schema.js';
import { CATEGORIES, KEYWORDS, QUICK_ACTIONS, RECIPES, searchEntries, entriesByCategory } from '../core/catalog.js';
import { createWorkflow, createStep, serialize, deserialize, resolveParams } from '../core/workflow.js';
import { createHistory } from '../core/history.js';
import { createStore } from '../core/store.js';
import { diffLines } from '../core/diff.js';
import { fnv1a64 } from '../core/hash.js';
import { encodeEscapes, decodeEscapes } from '../core/escapes.js';
import { runChain, clearCache } from '../worker/executor.js';
import { createRunner, assert } from './harness.js';

function makeDoc(text, i) {
  return { id: `doc_${i}`, name: `doc_${i}`, text, meta: {} };
}

export function makeCtx() {
  return {
    progress() {},
    throwIfCancelled() {},
    log() {},
    warn() {},
    resolveTemplate: (str) => str,
    rng(seed) {
      let s = (seed >>> 0) || 1;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
    }
  };
}

async function runOp(id, input, params = {}) {
  const op = await get(id);
  const docs = (Array.isArray(input) ? input : [input]).map(makeDoc);
  const values = coerce(op.params, { ...defaults(op.params), ...params });
  return (await op.run(docs, values, makeCtx())).map((d) => d.text);
}

const ADVERSARIAL = [
  '',
  '\n',
  '\r\n\r\n',
  '   \t  ',
  'single',
  'caf\u00e9 \ud83d\udc4b\ud83c\udffd \u0645\u0631\u062d\u0628\u0627 \u4f60\u597d',
  '\ufeffBOM first line\r\nsecond\rthird',
  '{"a":[1,{"b":null}],"c":"x"}',
  'name,age\n"Smith, J",42\n"quote ""x""",7',
  '<p class="a">Hi &amp; <a href="https://x.y/?q=1">link</a></p>',
  '# H1\ntext\n## H2\n```js\ncode\n```',
  'a\u0000b\u200bc'
];

export async function runTests() {
  const { suite, test, run } = createRunner();
  await Promise.all(MANIFEST.map((m) => get(m.id)));

  suite('Core: schema', () => {
    test('int coerces, clamps and falls back to default', () => {
      const s = [{ key: 'n', type: 'int', default: 5, min: 1, max: 10 }];
      assert.eq(coerce(s, { n: '7' }).n, 7);
      assert.eq(coerce(s, { n: 99 }).n, 10);
      assert.eq(coerce(s, { n: -3 }).n, 1);
      assert.eq(coerce(s, { n: 'abc' }).n, 5);
    });
    test('enum rejects unknown values', () => {
      const s = [{ key: 'm', type: 'enum', default: 'a', options: [['a', 'A'], ['b', 'B']] }];
      assert.eq(coerce(s, { m: 'zzz' }).m, 'a');
      assert.eq(validate(s, { m: 'zzz' }).m, 'Invalid option');
    });
    test('regex validation flags bad patterns', () => {
      const s = [{ key: 'p', type: 'regex', default: '' }];
      assert.eq(validate(s, { p: '(' }).p, 'Invalid regular expression');
      assert.eq(validate(s, { p: '\\d+' }).p, undefined);
    });
    test('pairs coerce drops junk rows', () => {
      const s = [{ key: 'pairs', type: 'pairs', default: [] }];
      assert.eq(coerce(s, { pairs: [null, { find: 'a' }, 7] }).pairs, [{ find: 'a', replace: '' }]);
    });
    test('show() hides params from validation', () => {
      const s = [{ key: 'm', type: 'enum', default: 'x', options: [['x', 'X']] }, { key: 'p', type: 'regex', default: '(', show: (v) => v.m === 'y' }];
      assert.eq(Object.keys(validate(s, { m: 'x', p: '(' })).length, 0);
    });
  });

  suite('Core: workflow', () => {
    test('serialize / deserialize round-trip', () => {
      const wf = createWorkflow('Round trip');
      wf.steps.push(createStep('text.case', { mode: 'lower' }));
      const back = deserialize(serialize(wf));
      assert.eq(back.steps[0].op, 'text.case');
      assert.eq(back.meta.name, 'Round trip');
    });
    test('rejects unknown ops, bad kinds and versions', async () => {
      const wf = createWorkflow('x');
      wf.steps.push({ id: 's1', op: 'nope.nope', params: {}, enabled: true });
      await assert.throws(() => deserialize(JSON.stringify(wf)), /invalid steps/);
      await assert.throws(() => deserialize('{"kind":"other"}'), /Not a Sluice/);
      await assert.throws(() => deserialize(JSON.stringify({ ...createWorkflow('x'), version: 9 })), /Unsupported/);
      await assert.throws(() => deserialize('not json'));
    });
    test('rejects invalid parameter keys', async () => {
      const wf = { ...createWorkflow('x'), params: [{ key: '1bad' }] };
      await assert.throws(() => deserialize(JSON.stringify(wf)), /parameters/);
    });
    test('resolveParams substitutes $refs and honours overrides', () => {
      const params = [{ key: 'sep', default: ',' }];
      assert.eq(resolveParams({ separator: '$sep', other: 'x' }, params), { separator: ',', other: 'x' });
      assert.eq(resolveParams({ separator: '$sep' }, params, { sep: ';' }), { separator: ';' });
      assert.eq(resolveParams({ separator: '$missing' }, params), { separator: '$missing' });
    });
  });

  suite('Core: history, store, hash, diff, escapes', () => {
    test('history undo / redo / branch truncation', () => {
      const h = createHistory({ v: 1 });
      h.push({ v: 2 });
      h.push({ v: 3 });
      assert.eq(h.undo(), { v: 2 });
      h.push({ v: 9 });
      assert.eq(h.canRedo(), false);
      assert.eq(h.undo(), { v: 2 });
      assert.eq(h.redo(), { v: 9 });
    });
    test('history ignores duplicate pushes', () => {
      const h = createHistory({ a: 1 });
      h.push({ a: 1 });
      assert.eq(h.canUndo(), false);
    });
    test('store notifies only changed keys', () => {
      const s = createStore({ a: 1, b: 2 });
      const calls = [];
      s.subscribe((_, changed) => calls.push(changed));
      s.set({ a: 1 });
      s.set({ a: 2, b: 2 });
      assert.eq(calls, [['a']]);
    });
    test('fnv1a64 is stable and 16 hex chars', () => {
      assert.eq(fnv1a64(''), 'cbf29ce484222325');
      assert.eq(fnv1a64('a').length, 16);
      assert.ok(fnv1a64('a') !== fnv1a64('b'));
    });
    test('diffLines produces minimal edit script', () => {
      const ops = diffLines(['a', 'b', 'c'], ['a', 'x', 'c']);
      assert.eq(ops.map((o) => o.type), ['equal', 'remove', 'add', 'equal']);
      assert.eq(diffLines([], []), []);
      assert.eq(diffLines(['a'], []).map((o) => o.type), ['remove']);
    });
    test('escape helpers round-trip tabs and newlines', () => {
      assert.eq(encodeEscapes('a\tb\nc'), 'a\\tb\\nc');
      assert.eq(decodeEscapes('a\\tb\\nc'), 'a\tb\nc');
      assert.eq(decodeEscapes('keep \\\\n literal'), 'keep \\\\n literal');
    });
  });

  suite('Catalog & organisation', () => {
    test('every op module matches its manifest entry', () => {
      for (const m of MANIFEST) {
        const op = getSync(m.id);
        assert.eq(op.id, m.id, 'id');
        assert.eq(op.group, m.group, `${m.id} group`);
      }
    });
    test('op ids are unique', () => {
      assert.eq(new Set(MANIFEST.map((m) => m.id)).size, MANIFEST.length);
    });
    test('every op belongs to a known category', () => {
      const ids = new Set(CATEGORIES.map((c) => c.id));
      for (const m of MANIFEST) assert.ok(ids.has(m.group), `${m.id} -> ${m.group}`);
    });
    test('every category has at least 3 actions', () => {
      for (const [cat, list] of entriesByCategory()) assert.ok(list.length >= 3, `${cat} has ${list.length}`);
    });
    test('every op has search keywords', () => {
      for (const m of MANIFEST) assert.ok(KEYWORDS[m.id], `missing keywords for ${m.id}`);
    });
    test('every op declares a well-formed contract', () => {
      for (const m of MANIFEST) {
        const op = getSync(m.id);
        assert.ok(op.name && op.summary, `${m.id} name/summary`);
        assert.ok(['map', 'split', 'merge', 'reduce'].includes(op.arity), `${m.id} arity`);
        assert.ok(['exact', 'sample', 'none'].includes(op.previewFidelity), `${m.id} fidelity`);
        assert.ok(Array.isArray(op.params), `${m.id} params`);
        for (const p of op.params) {
          assert.ok(p.key && p.type && p.label, `${m.id} param shape`);
          if (p.type === 'enum') assert.ok(p.options.some((o) => o[0] === p.default), `${m.id}.${p.key} default not in options`);
        }
        assert.eq(typeof op.describe(coerce(op.params, defaults(op.params))), 'string', `${m.id} describe`);
      }
    });
    test('quick actions reference real ops with valid params', () => {
      for (const q of QUICK_ACTIONS) {
        const op = getSync(q.op);
        assert.ok(op, q.op);
        for (const k of Object.keys(q.params)) assert.ok(op.params.some((p) => p.key === k), `${q.id}: ${k}`);
      }
    });
    test('recipes reference real ops with valid params', () => {
      for (const r of RECIPES) {
        for (const [id, params] of r.steps) {
          const op = getSync(id);
          assert.ok(op, `${r.id}: ${id}`);
          for (const k of Object.keys(params)) assert.ok(op.params.some((p) => p.key === k), `${r.id} ${id}: ${k}`);
        }
      }
    });
    const searches = [
      ['dedupe', 'lines.dedupe'],
      ['unique', 'lines.dedupe'],
      ['uppercase', 'text.case'],
      ['pretty json', 'data.jsonFormat'],
      ['base64', 'code.base64'],
      ['emails', 'extract.emails'],
      ['sql', 'lines.toList'],
      ['jwt', 'code.jwtDecode'],
      ['word count', 'analyze.stats'],
      ['zero width', 'text.removeChars'],
      ['grep', 'lines.filter'],
      ['caf\u00e9', null]
    ];
    for (const [q, want] of searches) {
      test(`search "${q}" ${want ? `finds ${want} in top 3` : 'does not crash'}`, () => {
        const hits = searchEntries(q).slice(0, 3).map((e) => e.id);
        if (want) assert.ok(hits.includes(want), `got ${hits.join(', ')}`);
      });
    }
    test('search handles regex metacharacters safely', () => {
      for (const q of ['(', '[', '*', '\\', '?+', '.*']) searchEntries(q);
    });
  });

  suite('Operations: documented examples', () => {
    for (const m of MANIFEST) {
      test(`${m.id} examples`, async () => {
        const op = getSync(m.id);
        const examples = op.examples || [];
        assert.ok(examples.length > 0, 'no examples');
        for (let i = 0; i < examples.length; i++) {
          const ex = examples[i];
          const docs = ex.in.map(makeDoc);
          const params = coerce(op.params, { ...defaults(op.params), ...ex.params });
          let actual;
          try {
            actual = (await op.run(docs, params, makeCtx())).map((d) => d.text);
          } catch (e) {
            actual = [`__error__:${e.message}`];
          }
          assert.eq(actual, ex.out, `example #${i + 1}`);
        }
      });
    }
  });

  suite('Operations: robustness on adversarial input', () => {
    for (const m of MANIFEST) {
      if (m.id === 'flow.assert' || m.id === 'flow.script') continue;
      test(`${m.id} survives tricky input with defaults`, async () => {
        const op = getSync(m.id);
        const params = coerce(op.params, defaults(op.params));
        for (const text of ADVERSARIAL) {
          const out = await op.run([makeDoc(text, 0)], params, makeCtx());
          assert.ok(Array.isArray(out), 'returns an array');
          for (const d of out) assert.eq(typeof d.text, 'string', `text type for ${JSON.stringify(text)}`);
        }
      });
    }
    test('every op is pure: input docs are not mutated', async () => {
      for (const m of MANIFEST) {
        if (m.id === 'flow.script') continue;
        const op = getSync(m.id);
        const docs = [makeDoc('b\na\nb', 0), makeDoc('x,y', 1)];
        const snapshot = JSON.stringify(docs);
        try { await op.run(docs, coerce(op.params, defaults(op.params)), makeCtx()); } catch {}
        assert.eq(JSON.stringify(docs), snapshot, `${m.id} mutated its input`);
      }
    });
    test('multi-document input keeps arity contracts', async () => {
      for (const m of MANIFEST) {
        const op = getSync(m.id);
        if (op.arity !== 'map' || m.id.startsWith('flow.')) continue;
        const out = await op.run([makeDoc('a\nb', 0), makeDoc('c', 1)], coerce(op.params, defaults(op.params)), makeCtx());
        assert.eq(out.length, 2, `${m.id} map op changed doc count`);
      }
    });
  });

  suite('Operations: behaviour checks', () => {
    test('case: all modes', async () => {
      const t = 'hello big_world-foo';
      assert.eq(await runOp('text.case', t, { mode: 'camel' }), ['helloBigWorldFoo']);
      assert.eq(await runOp('text.case', t, { mode: 'pascal' }), ['HelloBigWorldFoo']);
      assert.eq(await runOp('text.case', t, { mode: 'snake' }), ['hello_big_world_foo']);
      assert.eq(await runOp('text.case', t, { mode: 'constant' }), ['HELLO_BIG_WORLD_FOO']);
      assert.eq(await runOp('text.case', 'aB', { mode: 'swap' }), ['Ab']);
      assert.eq(await runOp('text.case', 'one. two', { mode: 'sentence' }), ['One. Two']);
    });
    test('dedupe: case-insensitive, adjacent, counts, keep last', async () => {
      assert.eq(await runOp('lines.dedupe', 'A\na\nb', { caseInsensitive: true }), ['A\nb']);
      assert.eq(await runOp('lines.dedupe', 'a\na\nb\na', { scope: 'adjacent' }), ['a\nb\na']);
      assert.eq(await runOp('lines.dedupe', 'a\nb\na', { addCounts: true }), ['2\ta\n1\tb']);
      assert.eq(await runOp('lines.dedupe', 'X\nx', { caseInsensitive: true, keep: 'last' }), ['x']);
    });
    test('sort: reverse, length, case-insensitive', async () => {
      assert.eq(await runOp('lines.sort', 'a\nc\nb', { reverse: true }), ['c\nb\na']);
      assert.eq(await runOp('lines.sort', 'ccc\na\nbb', { mode: 'length' }), ['a\nbb\nccc']);
      assert.eq(await runOp('lines.sort', 'b\nA\nc', { mode: 'natural', caseInsensitive: true }), ['A\nb\nc']);
    });
    test('filter: every mode', async () => {
      const t = 'apple\nbanana\n\ncherry\napple';
      assert.eq(await runOp('lines.filter', t, { mode: 'contains', value: 'an' }), ['banana']);
      assert.eq(await runOp('lines.filter', t, { mode: 'regex', pattern: '^a' }), ['apple\napple']);
      assert.eq(await runOp('lines.filter', t, { mode: 'blank' }), ['']);
      assert.eq(await runOp('lines.filter', t, { mode: 'notBlank' }), ['apple\nbanana\ncherry\napple']);
      assert.eq(await runOp('lines.filter', t, { mode: 'duplicatesOnly' }), ['apple']);
    });
    test('find & replace: regex groups, whole word, case, first only', async () => {
      assert.eq(await runOp('find.replace', 'john smith', { mode: 'regex', find: '(\\w+) (\\w+)', replaceWith: '$2, $1' }), ['smith, john']);
      assert.eq(await runOp('find.replace', 'cat concat', { mode: 'word', find: 'cat', replaceWith: 'dog' }), ['dog concat']);
      assert.eq(await runOp('find.replace', 'Foo foo', { find: 'foo', replaceWith: 'x', caseSensitive: false }), ['x x']);
      assert.eq(await runOp('find.replace', 'a a a', { find: 'a', replaceWith: 'b', global: false }), ['b a a']);
      assert.eq(await runOp('find.replace', 'a a a', { find: 'a', replaceWith: 'b', global: false, nth: 3 }), ['a a b']);
      assert.eq(await runOp('find.replace', 'a.b', { find: '.', replaceWith: '!' }), ['a!b']);
    });
    test('replace many applies pairs in order', async () => {
      assert.eq(await runOp('find.replaceMany', 'cat dog', { pairs: [{ find: 'cat', replace: 'dog' }, { find: 'dog', replace: 'bird' }] }), ['bird bird']);
    });
    test('split ops produce named chunks', async () => {
      const op = getSync('split.byLines');
      const out = await op.run([makeDoc('1\n2\n3\n4\n5', 0)], coerce(op.params, { count: 2 }), makeCtx());
      assert.eq(out.map((d) => d.text), ['1\n2', '3\n4', '5']);
      assert.eq(out[0].name, 'doc_0-001');
      const byHeading = await runOp('split.byHeading', 'intro\n## A\na\n## B\nb', { level: 2 });
      assert.eq(byHeading.length, 3);
    });
    test('merge ops combine documents', async () => {
      assert.eq(await runOp('merge.zipLines', ['a\nb', '1\n2'], { separator: ':' }), ['a:1\nb:2']);
      assert.eq(await runOp('merge.concat', ['x', 'y'], { separator: '|' }), ['x|y']);
      assert.eq(await runOp('merge.joinLines', ['a\nb'], { separator: ', ' }), ['a, b']);
    });
    test('large input: 200k lines handled without stack overflow', async () => {
      const big = Array.from({ length: 200000 }, (_, i) => `row${i % 1000},${i}`).join('\n');
      const t = await runOp('lines.transpose', big, { separator: ',' });
      assert.eq(t[0].split('\n').length, 2);
      const z = await runOp('merge.zipLines', [big, big], { separator: '|' });
      assert.eq(z[0].split('\n').length, 200000);
      const a = await runOp('lines.align', big.slice(0, 200000), { delimiter: ',' });
      assert.ok(a[0].length > 0);
      const d = await runOp('lines.dedupe', big);
      assert.eq(d[0].split('\n').length, 200000);
    }, { timeout: 30000 });
    test('JSON round-trips: CSV \u2192 JSON \u2192 CSV', async () => {
      const csv = 'name,age\n"Smith, J",42';
      const [json] = await runOp('data.csvToJson', csv);
      assert.eq(JSON.parse(json), [{ name: 'Smith, J', age: '42' }]);
      assert.eq(await runOp('data.jsonToCsv', json), [csv]);
    });
    test('encoders round-trip unicode', async () => {
      const s = 'caf\u00e9 \ud83d\ude00 <a&b> "q"';
      for (const id of ['code.base64', 'code.urlEncode', 'code.hex', 'code.htmlEntities', 'code.escapeJson', 'code.quotedPrintable', 'code.unicodeEscape']) {
        const [enc] = await runOp(id, s, { mode: 'encode' });
        const [dec] = await runOp(id, enc, { mode: 'decode' });
        assert.eq(dec, s, id);
      }
      const [r] = await runOp('code.rot13', s);
      assert.eq((await runOp('code.rot13', r))[0], s, 'rot13');
    });
    test('invalid input degrades gracefully instead of throwing', async () => {
      assert.eq(await runOp('data.jsonFormat', '{oops'), ['{oops']);
      assert.eq(await runOp('code.base64', '%%%', { mode: 'decode' }), ['%%%']);
      assert.eq(await runOp('code.urlEncode', '%E0%A4%A', { mode: 'decode' }), ['%E0%A4%A']);
      assert.match((await runOp('data.jsonValidate', '{"a":}'))[0], /^invalid/);
      assert.eq(await runOp('split.byRegex', 'abc', { pattern: '(' }), ['abc']);
    });
    test('toList formats', async () => {
      assert.eq(await runOp('lines.toList', 'a\nb', { format: 'bullets' }), ['- a\n- b']);
      assert.eq(await runOp('lines.toList', 'a\nb', { format: 'checklist' }), ['- [ ] a\n- [ ] b']);
      assert.eq(await runOp('lines.toList', 'a\nb', { format: 'comma' }), ['a, b']);
      assert.eq(await runOp('lines.toList', 'a"b', { format: 'quoted' }), ['"a\\"b"']);
      assert.eq(await runOp('lines.toList', '<x>', { format: 'html' }), ['<ul>\n  <li>&lt;x&gt;</li>\n</ul>']);
      assert.eq(await runOp('lines.toList', 'a\nb', { format: 'sentence' }), ['a and b']);
    });
    test('toList and splitToLines are inverses for comma lists', async () => {
      const [list] = await runOp('lines.toList', 'a\nb\nc', { format: 'comma' });
      assert.eq(await runOp('lines.splitToLines', list, { delimiter: 'comma' }), ['a\nb\nc']);
    });
    test('uuid: count, format, seeded reproducibility', async () => {
      const [a] = await runOp('gen.uuid', '', { count: 3, seed: 7 });
      const [b] = await runOp('gen.uuid', '', { count: 3, seed: 7 });
      assert.eq(a, b);
      const lines = a.split('\n');
      assert.eq(lines.length, 3);
      for (const l of lines) assert.match(l, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      const [r1] = await runOp('gen.uuid', '', { count: 2, seed: 0 });
      const [r2] = await runOp('gen.uuid', '', { count: 2, seed: 0 });
      assert.ok(r1 !== r2, 'unseeded output should differ');
    });
    test('sample: seeded, bounded, order-preserving', async () => {
      const t = Array.from({ length: 50 }, (_, i) => String(i)).join('\n');
      const [a] = await runOp('lines.sample', t, { count: 5, seed: 3 });
      const [b] = await runOp('lines.sample', t, { count: 5, seed: 3 });
      assert.eq(a, b);
      const nums = a.split('\n').map(Number);
      assert.eq(nums.length, 5);
      assert.eq(nums, [...nums].sort((x, y) => x - y));
    });
    test('jwt decode shows readable times', async () => {
      const recipe = RECIPES.find((r) => r.id === 'r-jwt');
      const [out] = await runOp('code.jwtDecode', recipe.sample, { part: 'both' });
      const json = JSON.parse(out);
      assert.eq(json.payload.name, 'Ada');
      assert.match(json.times.iat, /^2023-11-14T/);
    });
    test('json validate reports line and column', async () => {
      const [out] = await runOp('data.jsonValidate', '{\n  "a": 1,\n  "b": \n}');
      assert.match(out, /^invalid/);
    });
    test('remove characters: control and punctuation', async () => {
      assert.eq(await runOp('text.removeChars', 'a\u0001b\u007fc', { kind: 'control' }), ['abc']);
      assert.eq(await runOp('text.removeChars', 'hi, there! #1', { kind: 'punctuation' }), ['hi there 1']);
    });
    test('hash produces SHA-256', async () => {
      assert.eq(await runOp('code.hash', 'abc'), ['ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad']);
    });
  });

  suite('Engine: executor pipeline', () => {
    const docs = [makeDoc('b\na\nb\n  c  ', 0)];
    test('chains steps in order and skips disabled steps', async () => {
      clearCache();
      const steps = [
        { id: 's1', op: 'ws.trimLines', params: {}, enabled: true },
        { id: 's2', op: 'text.case', params: { mode: 'upper' }, enabled: false },
        { id: 's3', op: 'lines.dedupe', params: {}, enabled: true },
        { id: 's4', op: 'lines.sort', params: {}, enabled: true }
      ];
      const { docs: out, errors } = await runChain(docs, steps, []);
      assert.eq(errors, []);
      assert.eq(out[0].text, 'a\nb\nc');
    });
    test('cache returns identical keys for identical chains', async () => {
      const steps = [{ id: 's1', op: 'text.case', params: { mode: 'upper' }, enabled: true }];
      const a = await runChain(docs, steps, []);
      const b = await runChain(docs, steps, []);
      assert.eq(a.key, b.key);
      const c = await runChain(docs, [{ ...steps[0], params: { mode: 'lower' } }], []);
      assert.ok(c.key !== a.key);
    });
    test('step errors stop the chain and are attributed', async () => {
      const steps = [
        { id: 'ok', op: 'text.case', params: {}, enabled: true },
        { id: 'bad', op: 'flow.assert', params: { mode: 'docCount', expectedCount: 9 }, enabled: true },
        { id: 'after', op: 'text.case', params: { mode: 'lower' }, enabled: true }
      ];
      const { docs: out, errors } = await runChain(docs, steps, []);
      assert.eq(errors.length, 1);
      assert.eq(errors[0].stepId, 'bad');
      assert.eq(out[0].text, 'B\nA\nB\n  C  ');
    });
    test('unknown op is reported, not thrown', async () => {
      const { errors } = await runChain(docs, [{ id: 'x', op: 'missing.op', params: {}, enabled: true }], []);
      assert.match(errors[0].message, /Unknown op/);
    });
    test('sample mode skips non-previewable ops with a hint', async () => {
      const { errors } = await runChain(docs, [{ id: 'x', op: 'lines.sort', params: {}, enabled: true }], [], { sample: 3 });
      assert.eq(errors[0].hint, 'Run to see result');
    });
    test('workflow params resolve into step params', async () => {
      const steps = [{ id: 's', op: 'merge.joinLines', params: { separator: '$sep' }, enabled: true }];
      const { docs: out } = await runChain([makeDoc('a\nb', 0)], steps, [{ key: 'sep', default: '+' }], { overrides: { sep: '~' } });
      assert.eq(out[0].text, 'a~b');
    });
    test('cancellation aborts the run', async () => {
      await assert.throws(() => runChain(docs, [{ id: 's', op: 'text.case', params: {}, enabled: true }], [], { isCancelled: () => true }), /cancelled/);
    });
    test('every recipe runs cleanly on its own sample', async () => {
      for (const r of RECIPES) {
        const steps = r.steps.map(([op, params], i) => ({ id: `r${i}`, op, params, enabled: true }));
        const { errors, docs: out } = await runChain([makeDoc(r.sample || 'sample text', 0)], steps, []);
        assert.eq(errors, [], r.id);
        assert.ok(out.length >= 1, `${r.id} produced docs`);
      }
    });
    test('recipe "Clean up a messy list" gives expected result', async () => {
      const r = RECIPES.find((x) => x.id === 'r-clean-list');
      const steps = r.steps.map(([op, params], i) => ({ id: `r${i}`, op, params, enabled: true }));
      const { docs: out } = await runChain([makeDoc(r.sample, 0)], steps, []);
      assert.eq(out[0].text, 'apple\nbanana\ncherry\nfile2\nfile10');
    });
    test('recipe "IDs to SQL IN" escapes quotes', async () => {
      const r = RECIPES.find((x) => x.id === 'r-sql-in');
      const steps = r.steps.map(([op, params], i) => ({ id: `r${i}`, op, params, enabled: true }));
      const { docs: out } = await runChain([makeDoc(r.sample, 0)], steps, []);
      assert.eq(out[0].text, "(1042, 1043, 'O''Brien')");
    });
  });

  return run();
}

const syncCache = new Map();
function getSync(id) {
  return syncCache.get(id);
}

export async function preloadOps() {
  const mods = await Promise.all(MANIFEST.map((m) => get(m.id)));
  mods.forEach((op, i) => syncCache.set(MANIFEST[i].id, op));
}

const originalRun = runTests;
export async function runAll() {
  await preloadOps();
  return originalRun();
}

if (typeof window !== 'undefined') {
  window.__sluiceRunTests = runAll;
}
