# Primy v15.1.2

Primy es una PWA en castellano para crear, guardar y comprobar jugadas de **La Primitiva** y **EuroDreams**. La aplicación no vende boletos, no predice sorteos y no garantiza premios.

## Novedades de v15.1.2

- SELAE es la fuente oficial de resultados; no se utiliza una API comercial con cuota mensual.
- Supabase sincroniza y valida los resultados de La Primitiva y EuroDreams en segundo plano.
- Todas las sesiones leen el mismo archivo `primy_draw_results`, por lo que el número de usuarios no multiplica las consultas externas.
- La sincronización se ejecuta por la noche y dispone de un segundo intento por la mañana.
- Vercel queda dedicado a servir la PWA y sus API de lectura: no necesita claves administrativas de Supabase.
- La última copia validada permanece disponible ante un fallo temporal de la fuente.

## Arquitectura

```text
Página oficial SELAE
        │
        ▼
Supabase Cron → Edge Functions → validación estricta
                                  │
                                  ▼
                         primy_draw_results
                                  │
                     ┌────────────┴────────────┐
                     ▼                         ▼
              API Vercel Primy          Clientes Primy
```

SELAE es la autoridad del dato. Debido a que su infraestructura rechaza algunas solicitudes directas de centros de datos, la sincronización usa una representación textual en caché de la página oficial, valida fecha, seis números y campos complementarios, y solo entonces archiva el resultado.

## Configuración de Vercel

Solo se requieren variables públicas de Supabase:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Opcionales para las API de lectura:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
RESULT_CACHE_TTL_MINUTES
```

No se necesitan `LOTERIA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ni `CRON_SECRET` en Vercel.

## Supabase

Las migraciones incluidas crean y configuran:

- `primy_draw_results`;
- índice por juego y fecha;
- RLS con lectura pública de resultados oficiales y escritura reservada a `service_role`;
- sincronización automática mediante `pg_cron` y `pg_net`;
- políticas RLS ottimizzate para los datos privados de Primy.

La infraestructura ya se encuentra aplicada al proyecto Supabase conectado.

## Desarrollo

```bash
npm install
npm run dev
npm test
npm run build
```

Requiere Node.js 20–24.

## Reglas implementadas

- **La Primitiva:** de 1 a 8 apuestas simples por boleto, seis números por columna y un único reintegro por resguardo.
- **EuroDreams:** de 1 a 6 apuestas simples por boleto, seis números y un número Sueño por apuesta.
- El historial y el laboratorio estadístico son informativos y no modifican la generación uniforme de la próxima jugada.

## Función scanner

El scanner de boletos permanece en la hoja de ruta. No se incluye una simulación basada únicamente en una fotografía: se implementará cuando exista reconocimiento real, validación de campos y uso explícito de la cámara posterior.
