# Final validation — PRIMY Web v18.7.0

## Executed
- `npm test`: 303 passed / 0 failed
- `npm run release:guard`: PASS
- Release: 18.7.0
- Play data contract: 18.7.0
- `/api/mobile-config` GET payload test: PASS
- `/api/mobile-config` non-GET rejection test: PASS
- 10 mobile-supported game IDs: PASS
- Android-only signup flag + closed web signup flag: PASS

## Build note
`npm run build` was attempted and returned `vite: not found` because this handoff environment does not have the local npm dependency binaries installed. `.github/workflows/web-ci.yml` is included to run `npm ci`, tests and the production build after push.
