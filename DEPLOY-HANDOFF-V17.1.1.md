# Deployment handoff — Primy v17.1.1

## Commit

`Release Primy v17.1.1 Manual Entry Input Hotfix`

## Deployment

Replace the repository contents on branch `main` with this package. The GitHub–Vercel integration should create a production deployment automatically.

## Post-deployment acceptance test

1. Open `Registrar boleto externo` on iPad/iPhone.
2. Select La Primitiva and tap six numbers plus the reintegro.
3. Save the ticket and reopen it from Archivo.
4. Repeat with Bonoloto, Euromillones, El Gordo and EuroDreams.
5. Open Lotería Nacional and enter five digits with the on-screen keypad.
6. Confirm that paste/manual text remains available as a fallback.

No Supabase migration or Edge Function deployment is required for this frontend-only hotfix. The v17.1 backend already active in production remains unchanged.
