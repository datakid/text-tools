export function runUserScript(code, docs, params) {
  const fn = new Function(
    'docs',
    'params',
    `${code}
;if (typeof transform !== 'function') { throw new Error('Script must define a transform(docs, params) function'); }
return transform(docs, params);`
  );
  return fn(docs, params);
}
