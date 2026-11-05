# Ship checklist for v2

- 291/291 unit and op tests, 38/38 E2E UI tests, and the smoke test all pass.
- Clean boot with no app console errors. The only error is the preview host's injected analytics beacon, which the app's strict CSP correctly blocks.
- Light and dark themes checked at desktop (1280) and mobile (390), including the action library.
- No code comments, no debug logging in app code, no external network requests (CSP `default-src 'self'`).
- Semantic landmarks (`header`, `aside`, `main`, `footer`), ARIA on the palette listbox, and `prefers-reduced-motion` support.
