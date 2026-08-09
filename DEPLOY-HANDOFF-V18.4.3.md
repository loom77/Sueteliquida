# Deploy handoff — PRIMY Web v18.4.3

## GitHub / Vercel
Upload the complete web package to the repository as usual.

## Important: single web test account
Set this Vercel environment variable to the email of the existing test account:

`VITE_WEB_TEST_EMAIL=<authorized-test-email>`

When configured, the web client rejects every other email before calling Supabase Auth. New-account creation code has also been removed from the web client.

Do **not** disable email sign-up globally in Supabase Auth: the Android app intentionally keeps new-account registration enabled.

## Validation
Run:

```bash
npm install
npm run release:check
```
