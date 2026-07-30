# Proveedor oficial SELAE — Primy v15.1.1

## Arquitectura activa

SELAE bloquea con HTTP 403 las solicitudes directas procedentes de diversos centros de datos. Primy mantiene SELAE como fuente oficial, pero obtiene una representación textual en caché de la página oficial de resultados y valida estrictamente cada sorteo antes de guardarlo.

Flujo:

1. Supabase Cron invoca `scheduled-sync-selae`.
2. La función protegida `sync-selae` recupera una única instantánea de la página oficial de resultados.
3. Se extraen y validan La Primitiva y EuroDreams.
4. Los resultados se guardan con `upsert` en `primy_draw_results`.
5. Todas las sesiones de Primy leen desde Supabase, sin nuevas llamadas externas.

La sincronización se ejecuta a las 22:45 y tiene un reintento a las 07:15. Un fallo temporal conserva el último resultado validado.

## Seguridad

- La clave `service_role` permanece exclusivamente dentro de Supabase Edge Functions.
- Vercel y el navegador solo usan la clave publicable.
- La tabla permite lectura pública de resultados, pero no escritura pública.
