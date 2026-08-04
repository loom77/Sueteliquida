# Primy v16.8.0 — Final validation

## Scope

Immediate result verification and individual play checking.

## Functional changes

- Individual **Comprobar ahora** action for plays awaiting an official result.
- Live fallback to official SELAE result endpoints when the shared archive has not yet been updated.
- Successful live results are persisted for later checks.
- Automatic foreground and two-minute polling while due plays exist.
- Separate request controllers per game, preventing unrelated checks from cancelling one another.
- Negative result responses are no longer CDN-cached.
- Faster Supabase cron schedule for evening and post-midnight result synchronization.

## Validation

- Node test suite: **189 passed, 0 failed**.
- Relative imports: **324 checked, 0 missing**.
- JavaScript/JSX syntax validation: **109 files parsed, 0 errors**.
- ZIP integrity: verified during release packaging.

## Build limitation

A complete Vite production build was not executed in this environment because project dependencies are not installed and the `vite` executable is unavailable.

## Deployment requirement

Production behavior changes only after:

1. deploying the updated application and serverless API;
2. applying `supabase/migrations/20260804_fast_result_sync.sql` to the production Supabase project;
3. confirming the production cron secrets and endpoint URL.
