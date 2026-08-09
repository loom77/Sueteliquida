# PRIMY Web v18.4.3 — final validation

## Web account policy
- Public account creation UI removed.
- `supabase.auth.signUp` removed from the web auth hook.
- Login, password reset and password recovery remain available.
- Optional single-account gate added via `VITE_WEB_TEST_EMAIL`.
- Android registration is intentionally unaffected because Supabase email sign-up remains globally enabled.

## Primy Core parity contract
A web golden-vector test freezes the deterministic La Primitiva output used by Android 19.0.0-alpha3.

## Automated validation
- Node tests: 283 passed, 0 failed.
- Release guard: OK.
- Vite production build not executed in this runtime because the local `vite` binary is not installed. Run `npm install && npm run release:check` in deployment CI/Vercel.
