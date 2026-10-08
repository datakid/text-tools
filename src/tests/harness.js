export class AssertionError extends Error {}

function fmt(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export const assert = {
  ok(value, message = 'expected truthy') {
    if (!value) throw new AssertionError(message);
  },
  eq(actual, expected, message = '') {
    if (fmt(actual) !== fmt(expected)) throw new AssertionError(`${message ? `${message}: ` : ''}expected ${fmt(expected)}, got ${fmt(actual)}`);
  },
  match(actual, re, message = '') {
    if (!re.test(String(actual))) throw new AssertionError(`${message ? `${message}: ` : ''}${fmt(actual)} does not match ${re}`);
  },
  async throws(fn, re, message = 'expected to throw') {
    try {
      await fn();
    } catch (e) {
      if (re && !re.test(e.message)) throw new AssertionError(`${message}: wrong error "${e.message}"`);
      return;
    }
    throw new AssertionError(message);
  }
};

export function createRunner() {
  const suites = [];
  let current = null;

  function suite(name, fn) {
    current = { name, tests: [] };
    suites.push(current);
    fn();
    current = null;
  }

  function test(name, fn, { timeout = 10000 } = {}) {
    (current || suites[suites.length - 1]).tests.push({ name, fn, timeout });
  }

  async function run(onProgress) {
    const results = [];
    let pass = 0;
    let fail = 0;
    const started = performance.now();
    for (const s of suites) {
      const sr = { name: s.name, tests: [], pass: 0, fail: 0 };
      results.push(sr);
      for (const t of s.tests) {
        const t0 = performance.now();
        let error = null;
        try {
          await Promise.race([
            Promise.resolve().then(t.fn),
            new Promise((_, rej) => setTimeout(() => rej(new Error(`timed out after ${t.timeout} ms`)), t.timeout))
          ]);
        } catch (e) {
          error = e;
        }
        const ms = Math.round(performance.now() - t0);
        sr.tests.push({ name: t.name, ok: !error, error: error ? error.message : null, ms });
        if (error) { sr.fail++; fail++; } else { sr.pass++; pass++; }
        onProgress?.({ pass, fail, suite: s.name, test: t.name });
      }
    }
    return { results, pass, fail, ms: Math.round(performance.now() - started) };
  }

  return { suite, test, run };
}

export function toTap({ results, pass, fail, ms }) {
  const lines = [];
  let n = 0;
  for (const s of results) {
    lines.push(`# ${s.name} (${s.pass}/${s.tests.length})`);
    for (const t of s.tests) {
      n++;
      lines.push(`${t.ok ? 'ok' : 'not ok'} ${n} - ${t.name}${t.ms > 200 ? ` (${t.ms} ms)` : ''}`);
      if (!t.ok) lines.push(`  ---\n  ${t.error}\n  ...`);
    }
  }
  lines.push(`1..${n}`, `# pass ${pass}`, `# fail ${fail}`, `# time ${ms} ms`);
  return lines.join('\n');
}

export function renderReport(root, report, title) {
  root.innerHTML = '';
  const head = document.createElement('header');
  head.className = `report-head ${report.fail ? 'is-fail' : 'is-pass'}`;
  head.innerHTML = `<h1>${title}</h1><p><strong>${report.pass}</strong> passed \u00b7 <strong>${report.fail}</strong> failed \u00b7 ${report.results.length} suites \u00b7 ${report.ms} ms</p>`;
  root.appendChild(head);
  for (const s of report.results) {
    const det = document.createElement('details');
    det.className = `report-suite ${s.fail ? 'is-fail' : 'is-pass'}`;
    if (s.fail) det.open = true;
    const sum = document.createElement('summary');
    sum.textContent = `${s.fail ? '\u2717' : '\u2713'} ${s.name} \u2014 ${s.pass}/${s.tests.length}`;
    det.appendChild(sum);
    const ul = document.createElement('ul');
    for (const t of s.tests) {
      const li = document.createElement('li');
      li.className = t.ok ? 'ok' : 'bad';
      li.textContent = `${t.ok ? '\u2713' : '\u2717'} ${t.name}${t.ms > 200 ? ` \u00b7 ${t.ms} ms` : ''}${t.error ? `\n    ${t.error}` : ''}`;
      ul.appendChild(li);
    }
    det.appendChild(ul);
    root.appendChild(det);
  }
  const pre = document.createElement('pre');
  pre.id = 'results';
  pre.dataset.fail = String(report.fail);
  pre.dataset.pass = String(report.pass);
  pre.className = 'report-tap';
  pre.textContent = toTap(report);
  const tapDet = document.createElement('details');
  tapDet.innerHTML = '<summary>TAP output</summary>';
  tapDet.appendChild(pre);
  root.appendChild(tapDet);
}
