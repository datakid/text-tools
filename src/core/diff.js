export function diffLines(a, b) {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const v = new Map();
  v.set(1, 0);
  const trace = [];

  for (let d = 0; d <= max; d++) {
    trace.push(new Map(v));
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && v.get(k - 1) < v.get(k + 1))) {
        x = v.get(k + 1);
      } else {
        x = v.get(k - 1) + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x += 1;
        y += 1;
      }
      v.set(k, x);
      if (x >= n && y >= m) return backtrack(a, b, trace, d);
    }
  }
  return [];
}

function backtrack(a, b, trace, d) {
  let x = a.length;
  let y = b.length;
  const ops = [];

  for (let depth = d; depth > 0; depth--) {
    const v = trace[depth];
    const k = x - y;
    const prevK = k === -depth || (k !== depth && v.get(k - 1) < v.get(k + 1)) ? k + 1 : k - 1;
    const prevX = v.get(prevK);
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', line: a[x - 1] });
      x -= 1;
      y -= 1;
    }
    if (x === prevX) {
      ops.push({ type: 'add', line: b[y - 1] });
      y -= 1;
    } else {
      ops.push({ type: 'remove', line: a[x - 1] });
      x -= 1;
    }
  }
  while (x > 0 && y > 0) {
    ops.push({ type: 'equal', line: a[x - 1] });
    x -= 1;
    y -= 1;
  }
  return ops.reverse();
}
