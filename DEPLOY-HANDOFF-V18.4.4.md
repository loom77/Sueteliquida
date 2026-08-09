# Deploy handoff — PRIMY v18.4.4

Deploy the complete web package to the GitHub main branch and let Vercel rebuild it.

Required production configuration remains unchanged:
- Supabase URL/publishable key
- `VITE_WEB_TEST_EMAIL` for the single web test account

Validation commands after checkout:

```bash
npm install
npm run release:check
```

Verification contract: `/api/check-results?game=<game>&dates=YYYY-MM-DD` must return the event for the exact requested date. The client-side settlement engine now rejects mismatched dates as a second line of defence.
