# Despliegue de Primy v15.1

## 1. Aplicar la migración

En Supabase → SQL Editor, ejecuta:

`supabase/migrations/20260730_create_primy_draw_results.sql`

La tabla `primy_draw_results` queda cerrada para el navegador y disponible únicamente para el servidor con `service_role`.

## 2. Añadir variables en Vercel

Mantén las variables públicas existentes:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Añade solo al entorno server-side:

- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

Puedes eliminar `LOTERIA_API_KEY`. No la utiliza ningún archivo de ejecución de v15.1.

## 3. Desplegar

Sube el contenido del proyecto al repositorio. Vercel detectará el nuevo cron definido en `vercel.json` y ejecutará la sincronización diaria.

## 4. Crear el archivo histórico

Desde un terminal con Node.js 20 o superior y las variables server-side configuradas:

```bash
npm install
npm run backfill:selae -- --game=all --from=2016-01-01
```

El proceso puede detenerse y reanudarse: consulta Supabase, omite las fechas ya guardadas y continúa con las pendientes.

## 5. Verificación

- `/api/provider-status`: debe indicar `provider: SELAE`.
- `/api/bootstrap`: debe devolver al menos un juego en `games`.
- `/api/sync-results`: requiere `Authorization: Bearer <CRON_SECRET>`.
- Perfil → Información y ajustes avanzados → Fuente de datos: debe aparecer conectada.

## Seguridad

La clave `SUPABASE_SERVICE_ROLE_KEY` no debe copiarse en el código, el navegador, una variable `VITE_*` ni un archivo que se publique en GitHub.
