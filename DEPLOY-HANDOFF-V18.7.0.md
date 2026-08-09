# Deploy handoff — PRIMY Web v18.7.0

1. Upload the complete v18.7.0 web package to the web repository.
2. Ensure the existing Vercel/Supabase environment variables remain configured.
3. GitHub CI runs `npm ci`, release guard, tests and Vite production build.
4. After deploy verify `GET /api/mobile-config` returns playDataContract `18.7.0` and ten supported games.
5. Android 19.3.0-beta3 should then show a compatible backend status in Perfil.

Web signup remains intentionally closed. Do not disable Supabase signup globally because Android registration must remain available.
