# Final validation — PRIMY Web v18.5.0

- Version: 18.5.0
- Data contract: 18.5.0
- Node tests: 292 passed, 0 failed
- Release guard: PASS
- Public web signup: disabled
- Existing login/password recovery: retained
- Android bridge coverage: La Primitiva, Bonoloto, Euromillones, El Gordo, EuroDreams
- Exact stored draw-date verification lock: retained

## Build note
`npm run build` could not run in this runtime because the `vite` executable is not installed (`vite: not found`). Run `npm install` and `npm run release:check` in CI/Vercel/GitHub before production deployment.
