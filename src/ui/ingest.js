import { triggerPreview } from './previewController.js';

let latestIngest = 0;

export async function ingestText(store, engine, text, name = 'pasted.txt') {
  const request = ++latestIngest;
  try {
    const { docSetKey } = await engine.ingest([{ name, text }]);
    if (request !== latestIngest) return;
    store.set({ docSetKey, activeDocIndex: 0, previewDocSetKey: null, runDocSetKey: null, docsMeta: [], stats: null, errors: [], previewMode: true });
    triggerPreview(store, engine);
  } catch (error) {
    if (request === latestIngest) store.set({ errors: [{ message: error.message }] });
  }
}
