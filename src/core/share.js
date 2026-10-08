import { migrate } from './workflow.js';
import { shortId } from './id.js';

const MAX_INPUT_CHARS = 20000;

function toB64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s) {
  let b = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  const bin = atob(b);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

const canCompress = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

export function packPayload(workflow, input) {
  const payload = {
    v: 1,
    n: workflow.meta.name,
    s: workflow.steps.map((s) => (s.enabled ? [s.op, s.params] : [s.op, s.params, 0])),
    p: workflow.params?.length ? workflow.params : undefined,
    i: input ? String(input).slice(0, MAX_INPUT_CHARS) : undefined
  };
  return payload;
}

export function unpackPayload(payload) {
  if (!payload || payload.v !== 1 || !Array.isArray(payload.s)) throw new Error('Not a Sluice share link');
  const workflow = migrate({
    kind: 'sluice.workflow',
    version: 1,
    meta: { id: `wf_${shortId()}`, name: String(payload.n || 'Shared workflow').slice(0, 120) || 'Shared workflow', updated: Date.now() },
    params: Array.isArray(payload.p) ? payload.p : [],
    steps: payload.s.map((row, i) => ({
      id: `s_${shortId()}${i}`,
      op: row[0],
      params: row[1] && typeof row[1] === 'object' && !Array.isArray(row[1]) ? row[1] : {},
      enabled: row[2] !== 0,
      note: ''
    }))
  });
  return { workflow, input: typeof payload.i === 'string' ? payload.i : null };
}

export async function encodeShare(workflow, input) {
  const json = new TextEncoder().encode(JSON.stringify(packPayload(workflow, input)));
  if (canCompress) {
    try {
      return `z${toB64url(await pipe(json, new CompressionStream('deflate-raw')))}`;
    } catch {}
  }
  return `j${toB64url(json)}`;
}

export async function decodeShare(token) {
  const kind = token[0];
  const body = fromB64url(token.slice(1));
  let bytes;
  if (kind === 'z') {
    if (!canCompress) throw new Error('This browser cannot open compressed share links');
    bytes = await pipe(body, new DecompressionStream('deflate-raw'));
  } else if (kind === 'j') {
    bytes = body;
  } else {
    throw new Error('Not a Sluice share link');
  }
  return unpackPayload(JSON.parse(new TextDecoder().decode(bytes)));
}

export function shareTokenFromHash(hash = location.hash) {
  const m = /^#w=([A-Za-z0-9_-]+)$/.exec(hash || '');
  return m ? m[1] : null;
}

export async function buildShareUrl(workflow, input) {
  const token = await encodeShare(workflow, input);
  const url = new URL(location.href);
  url.search = '';
  url.hash = `w=${token}`;
  return url.toString();
}

export { MAX_INPUT_CHARS };
