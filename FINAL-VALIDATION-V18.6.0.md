# Final validation — PRIMY Web v18.6.0

## Executed
- `npm test`: 298 passed, 0 failed.
- `npm run release:guard`: OK (125 src files, 71 test files, critical files present).
- Android special-games bridge test: included in the full suite.

## Bridge assertions
- Lotería Nacional Android payload preserves `00123` as a five-digit string.
- Quiniela and Quinigol Android payloads preserve roundId/sourceHash and selections.
- Lototurf and Quíntuple Plus Android payloads preserve their selections.
- Unified verification refuses mismatched sports/horse dates and rounds.
- Public web signup remains closed.

## Build limitation in this runtime
`npm run build` was attempted and could not run because the local `vite` binary is absent (`vite: not found`). The deployment environment must install dependencies before running the build/release check.
