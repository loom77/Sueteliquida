# PRIMY Web v18.4.2 — deploy handoff

## GitHub / Vercel
Upload the full web package or apply the patch, then run:

```bash
npm install
npm run release:check
```

Local validation in the ChatGPT workspace: 281 tests passed and release guard passed. The Vite build could not run here because `vite` is not installed in this environment.

## Supabase backend prerequisite
This release adds `supabase/functions/delete-account/index.ts`.
Deploy it to the same Supabase project before enabling account deletion in production:

```bash
supabase functions deploy delete-account
```

The function verifies the caller JWT, then uses `SUPABASE_SERVICE_ROLE_KEY` only inside the Edge Function environment to delete the authenticated user. The service-role credential must never be added to Vite or Android client configuration.

Existing foreign keys from Primy private tables to `auth.users(id) ON DELETE CASCADE` remove profile, plays, preferences and migration state with the account.

## Public deletion URL
`/legal/account-deletion.html` documents the deletion path for store-policy disclosure.
