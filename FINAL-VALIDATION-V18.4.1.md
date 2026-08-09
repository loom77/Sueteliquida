# PRIMY v18.4.1 — Final validation

- package/release: 18.4.1
- Node test suite: 279 passed, 0 failed
- release guard: OK (125 src, 64 test)
- unsaved generation guard: navigation, browser back, game switch, configuration discard, sign out, beforeunload
- draw selection data contract remains 18.4.0

## Build note
`npm run build` cannot run in this container because the local `vite` binary is not installed. Deployment must run `npm install` followed by `npm run release:check`.
