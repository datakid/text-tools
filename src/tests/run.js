import { get } from '../core/registry.js';
import { MANIFEST } from '../ops/index.js';
import { defaults, coerce } from '../core/schema.js';

function makeDoc(text, i) {
  return { id: `doc_${i}`, name: `doc_${i}`, text, meta: {} };
}

function makeCtx() {
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

export async function runTests() {
  let pass = 0;
  let fail = 0;
  const lines = [];

  for (const entry of MANIFEST) {
    const op = await get(entry.id);
    const examples = op.examples || [];
    if (examples.length === 0) {
      lines.push(`not ok - ${op.id}: no examples`);
      fail += 1;
      continue;
    }
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
      const ok = JSON.stringify(actual) === JSON.stringify(ex.out);
      lines.push(`${ok ? 'ok' : 'not ok'} - ${op.id} #${i + 1}`);
      if (ok) {
        pass += 1;
      } else {
        fail += 1;
        lines.push(`  expected: ${JSON.stringify(ex.out)}`);
        lines.push(`  actual:   ${JSON.stringify(actual)}`);
      }
    }
  }

  lines.push(`1..${pass + fail}`);
  lines.push(`# pass ${pass}`);
  lines.push(`# fail ${fail}`);
  return { pass, fail, output: lines.join('\n') };
}

if (typeof window !== 'undefined') {
  window.__sluiceRunTests = runTests;
}
