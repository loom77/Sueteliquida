# Final validation — PRIMY Web v18.4.4

Scope: exact official-event identity lock, web counterpart for Android 19.0.0-alpha4.

Validated:
- package/release/offline version = 18.4.4;
- stored `drawDateKey` is immutable for verification;
- a draw payload from another date returns `OFFICIAL_DATE_MISMATCH`;
- sports/horse round ID mismatch is rejected when the identifiers are present;
- mismatched official payload is not persisted into a pending play;
- web public signup remains closed from v18.4.3;
- no new service-role secret is introduced into the browser client;
- Node test suite: 286 passed, 0 failed;
- release guard: OK (125 src files, 68 test files).

Production Vite build is not claimed in this runtime because the local `vite` binary/dependency installation is unavailable. Run `npm install && npm run release:check` in CI/Vercel.
