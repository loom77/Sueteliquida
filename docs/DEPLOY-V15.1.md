# Despliegue de Primy v15.1.1

La infraestructura ya está preparada en Supabase:

- tabla `primy_draw_results` con RLS;
- lectura pública únicamente para resultados oficiales;
- Edge Functions `sync-selae` y `scheduled-sync-selae`;
- sincronización automática a las 22:45 y reintento a las 07:15;
- datos oficiales archivados en Supabase.

## Vercel

Primy ya no necesita `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` ni `LOTERIA_API_KEY` en Vercel.
Mantén únicamente:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

El proyecto lee los resultados desde Supabase. La sincronización externa se ejecuta una sola vez en el backend y no depende del número de usuarios.
