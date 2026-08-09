# PRIMY Web v18.7.0 — Mobile Readiness

## Changes
- Play data contract advanced to 18.7.0 for the Android beta3 bridge.
- Added `/api/mobile-config` as a lightweight Web ↔ Android compatibility contract.
- Mobile endpoint exposes the ten supported game IDs and explicit feature flags.
- Web public signup remains closed; Android signup remains allowed.
- Existing exact draw/round/program locks remain authoritative for result verification.
- Added GitHub Actions Web CI: install, release guard, tests, production Vite build and dist artifact.

## Validation
- 303 Node tests passed, 0 failed.
- Release guard passed: 126 source files / 72 test files.
- Local Vite build was attempted but cannot run in this environment because the `vite` binary is not installed locally.
