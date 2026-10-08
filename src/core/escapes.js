export function encodeEscapes(value) {
  return String(value ?? '').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
}

export function decodeEscapes(value) {
  return String(value ?? '').replace(/(?<!\\)\\([nrt])/g, (m, c) => (c === 'n' ? '\n' : c === 'r' ? '\r' : '\t'));
}

export function isMultilineParam(p) {
  return Boolean(p.multiline) || /one per line|\(optional\)$/i.test(p.label || '');
}
