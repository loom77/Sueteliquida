# Deploy handoff — PRIMY Web v18.4.5

Use the full v18.4.5 package as the GitHub/Vercel source.

Before production deploy:
1. install dependencies;
2. run `npm run release:check`;
3. confirm `VITE_WEB_TEST_EMAIL` still points to the single authorized web test account;
4. verify new-account registration is absent from the web UI;
5. verify an Android alpha5 Bonoloto draft appears on web without a fabricated reintegro.

No Supabase schema migration is required for v18.4.5.
