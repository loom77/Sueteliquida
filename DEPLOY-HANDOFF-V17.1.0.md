# Deployment handoff — Primy v17.1.0

## Commit

`Release Primy v17.1.0 Universal Sports & Horse Verification`

## Deployment

1. Replace the repository contents on `main` with this package.
2. Push the commit to `loom77/Sueteliquida`.
3. Wait for the automatic Vercel production deployment.
4. Verify the new asset hash and release stamp.
5. Clear or refresh the installed PWA if it keeps an older service worker.

## Production smoke test

- Quiniela: create, save and reopen a ticket; Pleno al 15 remains separate.
- Quinigol: while no verified round is available, it must remain in “Jornada en actualización”.
- Lototurf and Quíntuple Plus: no active round must be a controlled availability state.
- Archive: checked sports and horse tickets show the new official comparison reveal.
- An official category without scrutiny displays “Importe pendiente”.
- A positive official amount displays “Premio confirmado”.

## Backend

The Supabase migration and the three Fast Edge Function versions are already active in production. The Git/Vercel deployment is required only for the v17.1.0 frontend and client-side settlement/reveal changes.
