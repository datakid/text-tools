const ALPHABET = 'ModuleSymbhasOwnPr0123456789ABCDEFGHIJKLNQRTUVWXYZ_cfgijkpqtvxz';

let counter = 0;

export function nanoid(size = 8) {
  let bytes;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    bytes = crypto.getRandomValues(new Uint8Array(size));
  } else {
    bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let id = '';
  for (let i = 0; i < size; i++) id += ALPHABET[bytes[i] % ALPHABET.length];
  return id;
}

export function shortId(prefix = '') {
  counter += 1;
  return `${prefix}${nanoid(6)}${counter.toString(36)}`;
}
