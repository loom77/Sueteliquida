# Primy v13 — Release Candidate Review

## Scope
Final review before browser validation and the single production build.

## Deep links
- Current routes: `/`, `/crear`, `/explorar`, `/archivo`, `/ajustes`.
- Vercel rewrites now serve `index.html` for every current route.
- Legacy links `/generar` and `/jugadas` remain supported and resolve to the corresponding v13 views.
- Authentication callbacks `/auth/confirm` and `/auth/recovery` remain supported.

## Offline and PWA
- Workbox navigation fallback remains enabled for local app routes.
- Runtime cache names were upgraded from v12.6 to v13 to avoid stale cross-version data.
- The offline fallback no longer uses inline JavaScript, keeping it compatible with the production CSP.
- Local changes remain queued and are synchronized when connectivity returns.

## Synchronization
- The interface reports the exact number of pending changes when available.
- Profile includes an explicit retry action for queued changes.
- Successful and unsuccessful retries produce clear user feedback.
- Local cache schema is now marked as version 13.

## Error states
- Provider data can be rechecked from Profile.
- Result verification errors remain visible in Archive.
- Application-level failures are handled by the error boundary without deleting local data.
- Offline state is announced globally and describes the effect on synchronization.

## Copy audit
- Main interface remains fully in Spanish.
- Generation and historical analysis are clearly separated.
- No commercial message claims that Primy predicts a draw or improves the probability of a specific combination.

## Automated validation
- Domain and mathematical tests: 41/41 passing.
- Missing local imports: 0.
- `vercel.json`: valid JSON.
- Inline handlers in public assets: 0.

## Remaining release gates
1. Install frontend dependencies.
2. Run the Vite production build.
3. Run browser tests on the built application.
4. Validate phone, tablet and desktop layouts.
5. Generate the single final v13 package.
