import * as docstore from './docstore.js';
import { runChain, cacheStats } from './executor.js';
import { fnv1a64 } from '../core/hash.js';
import { diffLines } from '../core/diff.js';

const DIFF_LINE_BUDGET = 20000;

const cancelledJobs = new Set();

function isCancelled(jobId) {
  return cancelledJobs.has(jobId);
}

function statsFor(docs) {
  let lines = 0;
  let chars = 0;
  let bytes = 0;
  for (const d of docs) {
    chars += d.text.length;
    bytes += new TextEncoder().encode(d.text).length;
    lines += d.text.length ? d.text.split(/\r\n|\r|\n/).length : 0;
  }
  return { docs: docs.length, lines, chars, bytes };
}

function docSetKeyFor(docs) {
  return `ds_${fnv1a64(docs.map(d => `${d.id}:${fnv1a64(d.text)}`).join(','))}`;
}

self.onmessage = async (e) => {
  const { type, id, payload } = e.data;
  try {
    if (type === 'cancel') {
      cancelledJobs.add(payload.jobId);
      return;
    }

    if (type === 'ingest') {
      const docs = payload.chunks.map((c, i) => ({
        id: `doc_${i}_${fnv1a64(c.name + i)}`,
        name: c.name,
        text: c.text,
        meta: { source: c.name }
      }));
      const docSetKey = docSetKeyFor(docs);
      docstore.put(docSetKey, docs);
      self.postMessage({ id, ok: true, result: { docSetKey, stats: statsFor(docs) } });
      return;
    }

    if (type === 'preview' || type === 'run') {
      const jobId = id;
      cancelledJobs.delete(jobId);
      const inputDocs = docstore.get(payload.docSetKey) || [];
      const sample = type === 'preview' ? (payload.sampleBytes || 65536) : undefined;
      const { docs, key, errors } = await runChain(inputDocs, payload.steps, payload.params || [], {
        sample,
        overrides: payload.overrides || {},
        onProgress: (fraction) => self.postMessage({ type: 'progress', id: jobId, fraction }),
        onLog: (log) => self.postMessage({ type: 'log', id: jobId, log }),
        isCancelled: () => isCancelled(jobId)
      });
      const outKey = `ds_${key}`;
      docstore.put(outKey, docs);
      self.postMessage({
        id,
        ok: true,
        result: {
          docSetKey: outKey,
          docsMeta: docs.map((d) => ({
            id: d.id,
            name: d.name,
            chars: d.text.length,
            lines: d.text.length ? d.text.split(/\r\n|\r|\n/).length : 0,
            bytes: new TextEncoder().encode(d.text).length
          })),
          stats: statsFor(docs),
          errors,
          cache: cacheStats()
        }
      });
      return;
    }

    if (type === 'window') {
      const docs = docstore.get(payload.docSetKey) || [];
      const doc = docs[payload.docIndex];
      if (!doc) {
        self.postMessage({ id, ok: false, error: 'No such document' });
        return;
      }
      const lines = doc.text.split(/\r\n|\r|\n/);
      self.postMessage({
        id,
        ok: true,
        result: { lines: lines.slice(payload.from, payload.to), totalLines: lines.length }
      });
      return;
    }

    if (type === 'matches') {
      const docs = docstore.get(payload.docSetKey) || [];
      const rawFlags = payload.flags || '';
      const flags = rawFlags.includes('g') ? rawFlags : `${rawFlags}g`;
      let re;
      try {
        re = new RegExp(payload.pattern, flags);
      } catch (err) {
        self.postMessage({ id, ok: false, error: 'Invalid pattern' });
        return;
      }
      const hits = [];
      const limit = payload.limit || 5000;
      outer:
      for (let di = 0; di < docs.length; di++) {
        const lines = docs[di].text.split(/\r\n|\r|\n/);
        for (let li = 0; li < lines.length; li++) {
          re.lastIndex = 0;
          let m;
          while ((m = re.exec(lines[li]))) {
            hits.push({ doc: di, line: li, col: m.index, len: m[0].length, text: m[0] });
            if (hits.length >= limit) break outer;
            if (m[0].length === 0) re.lastIndex += 1;
          }
        }
      }
      self.postMessage({ id, ok: true, result: { hits } });
      return;
    }

    if (type === 'diff') {
      const docs = docstore.get(payload.docSetKey) || [];
      const otherDocs = payload.otherDocSetKey ? docstore.get(payload.otherDocSetKey) || [] : docs;
      const a = docs[payload.docIndex];
      const b = otherDocs[payload.otherDocIndex ?? payload.docIndex];
      if (!a || !b) {
        self.postMessage({ id, ok: false, error: 'No such document' });
        return;
      }
      const linesA = a.text.split(/\r\n|\r|\n/);
      const linesB = b.text.split(/\r\n|\r|\n/);
      if (linesA.length + linesB.length > DIFF_LINE_BUDGET) {
        self.postMessage({ id, ok: false, error: 'Diff is disabled for documents this large in this phase' });
        return;
      }
      const ops = diffLines(linesA, linesB);
      self.postMessage({ id, ok: true, result: { ops } });
      return;
    }

    if (type === 'export') {
      const docs = docstore.get(payload.docSetKey) || [];
      if (payload.mode === 'clip') {
        self.postMessage({ id, ok: true, result: { text: docs.map(d => d.text).join('\n\n') } });
        return;
      }
      self.postMessage({ id, ok: false, error: `Export mode "${payload.mode}" ships in a later phase` });
      return;
    }

    self.postMessage({ id, ok: false, error: `Unknown message type: ${type}` });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err.message });
  }
};
