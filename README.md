# Sluice v2 — local-first text workbench

Quick text tools and repeatable pipelines that run 100% in the browser. Paste text, click a tool, copy the result. Or chain tools into a saved, re-runnable workflow. No server, no uploads, no tracking.

## What's new in v2

### Organization & speed
- **Action library (`Ctrl/⌘ K` or the "Actions" button)**: a three-column browser.
  - **Category rail**: All, ★ Favorites, Recent, Recipes, plus 12 color-coded categories (Text, Whitespace, Lines, Find & replace, Extract, JSON & CSV, Encode, Split, Merge, Generate, Analyze, Flow), each with a count.
  - **Ranked search** over names, categories and synonyms ("unique" finds Dedupe, "grep" finds Filter, "sql" finds Lines to list).
  - **Live preview pane**: shows before/after on *your* input (or the built-in example when the input is empty).
  - Keys: `↵` adds the step · `⇧↵` applies to the input right away · `Alt ←/→` switches category · `Alt S` stars a tool · `Esc` clears the search, then closes.
- **Quick bar** above the editor: one-click chips for the most common tools, plus your starred favorites. `Shift+click` applies a tool straight to the input without adding a step.
- **"Use as input"** puts the output into the input box and clears the steps, so you can chain quick edits. Undo is available.
- **Recipes**: 8 ready-made multi-step pipelines (clean a list, unique emails, IDs to SQL `IN (…)`, CSV to Markdown, top words, LLM chunking, clean pasted prose, inspect a JWT).
- **Undo toasts** on every destructive action: delete step, clear steps, clear input, apply, bake.
- Header **undo/redo** buttons, a **`?` shortcut sheet**, and **Paste** and **Sample** buttons on the input.

### Better UX
- Step cards show a **live one-line summary of their settings** (e.g. "Sort natural") and a colored category badge. Errors and notes show on the card itself.
- The inspector adds **prev/next step navigation**, **favorite**, **reset settings**, **enable/disable**, and **worked examples** with a "Use these settings" button.
- **Exact live preview**: inputs up to 256 KB are now processed in full as you type, so Sort, Dedupe, Filter and similar tools show real results instead of "Run to see result". Larger inputs fall back to a clearly labeled "sample preview".
- Single-line fields accept `\n` and `\t`. List fields ("one per line") are now real multi-line text areas.
- The output shows line/char counts with the change vs. input. The diff view gets a +/− summary. The status strip shows the step count and preview mode.

### New tools (110 total, up from 100)
`Remove characters` (invisible/zero-width, control, emoji, non-ASCII, punctuation, digits, custom set) · `Straighten / curl quotes` · `Decode JWT` · `Unicode escape` · `Validate JSON` (+ JSON Lines) · `Random sample lines` · `Align columns` · `Lines to list` (bullets, numbered, checklist, comma, quoted, SQL IN, JSON array, HTML, "a, b, and c") · `Split items onto lines` · `Generate UUIDs`.

### Bugs fixed
- `Transpose`, `Zip`, `Interleave` and `Reduce to table` crashed with a RangeError on very large inputs (around 125k+ lines) because they spread arrays into `Math.max`.
- Numeric sort was broken when there were several non-numeric lines (`Infinity − Infinity = NaN`).
- Base64 decode wiped the text on invalid input. It now leaves the text unchanged, and also accepts URL-safe and unpadded input and line-wrapped base64.
- A modal that was still closing could block the next dialog's keyboard handling.

### Favicon
`icons/sluice.svg` is a flatter, minimal version of the original mark: a gold gate bar with cream bars on the left and teal bars on the right, on a dark rounded tile. `icons/sluice-mask.svg` is a monochrome version for mask-icon/monochrome use. Both are referenced from `manifest.webmanifest`.

## Entry points
| Path | Purpose |
|---|---|
| `index.html` | The app |
| `index.html?e2e` | Ephemeral mode: storage is in memory only, and `window.__sluice` is exposed (used by the tests) |
| `tests.html` | Unit + operation suite: **286 tests** |
| `e2e.html` | End-to-end UI suite, driving the real app in an iframe: **36 tests** |
| `smoke.html` | Worker smoke test |
| `demo.html`, `demo-palette.html`, `demo-browse.html`, `demo-input.html` | Pre-staged UI states for screenshots |

## Testing
- **Core**: schema coercion/validation, workflow (de)serialization and rejection of bad files, `$param` resolution, history, store, hash, Myers diff, escape helpers.
- **Catalog integrity**: every op matches its manifest, has a unique id, a known category, keywords, a well-formed param contract (enum defaults are valid), and a `describe()`. Every quick action and recipe points at real ops and params. Search relevance checks (e.g. "unique" → Dedupe in the top 3).
- **Every op's documented examples.**
- **Robustness**: every op runs on 12 adversarial inputs (empty, CRLF/CR, BOM, emoji/RTL/CJK, NUL and zero-width, quoted CSV, HTML, Markdown). Ops are checked for purity (input not mutated) and map-arity (doc count preserved).
- **Behavior**: all case modes, dedupe/sort/filter modes, regex replace with groups and nth-match, split/merge, encoder round-trips with Unicode for 7 encoders, CSV↔JSON round-trip, graceful degradation on bad input, a 200k-line stress test, and seeded reproducibility for UUID and sampling.
- **Engine**: chaining, disabled steps, cache keys, error attribution and stop, unknown ops, sample-mode hints, workflow params plus overrides, cancellation, and every recipe running end-to-end with exact expected outputs.
- **E2E UI**: boot, quick chips, Shift-apply plus undo, bake plus undo, palette (open, category filter, Alt+Arrow, search ranking, preview, Enter/Shift+Enter, Alt+S favorites, Recent, Esc behavior, recipes), inspector editing with `\n` escapes, reset, undo/redo, E/Del keys with undo, clear, Ctrl+Enter run, Diff/Stats/Find views, error flagging, split doc tabs, save to library, rejecting an invalid import, `?` help, theme.

## Architecture & data
- `src/ops/**`: one module per operation (`run(docs, params, ctx)`, plus `params`, `examples` and `describe`), lazy-loaded through `src/ops/index.js`.
- `src/core/catalog.js`: categories, search keywords, quick actions, recipes, ranked search.
- `src/core/prefs.js`: favorites and recents in `localStorage` (`sluice.favorites`, `sluice.recent`).
- `src/core/env.js`: storage wrapper. `?e2e` switches it to memory only.
- `src/worker/*`: the pipeline runs in a module Web Worker with a content-hash cache. `flow.script` runs in a sandboxed sub-worker with network APIs removed.
- IndexedDB `sluice` (stores `workflows`, `runs`, `prefs`): saved workflows, run history, current workflow. `localStorage`: the input draft and the theme.
- No backend or Table API is used. Everything stays on the device.

## Not yet implemented / next steps
- Exporting multiple docs as a ZIP or separate files (only "copy all" and "download .txt" exist).
- Previewing on a sample whose size the user can set, and streaming for inputs above about 50 MB.
- Drag-and-drop from the library onto a specific position in the pipeline.
- Sharing workflows as URLs (encode the workflow JSON into the hash).
- Real keyboard reordering inside the library, and user-defined custom quick-bar order.
