# Primy v15.1

Primy es una PWA en castellano para crear, guardar y comprobar jugadas de **La Primitiva** y **EuroDreams**. La aplicación no vende boletos, no predice sorteos y no garantiza premios.

## Novedades de v15.1

- SELAE sustituye a LoteriasAPI como fuente primaria de resultados.
- No se necesita ninguna clave ni plan de una API comercial.
- Los resultados oficiales se validan y se archivan en Supabase.
- La comprobación de jugadas solicita únicamente las fechas que todavía no están archivadas.
- Sincronización diaria protegida mediante Vercel Cron.
- Script reanudable para importar el histórico oficial directamente desde SELAE.
- La aplicación sigue funcionando con caché temporal si el archivo server-side todavía no está configurado.

## Arquitectura

```text
React + Vite + PWA
        │
        ├── Vercel Functions → SELAE oficial
        │                      │
        │                      └── validación y normalización
        │
        └── Supabase
             ├── Auth y datos de usuario con RLS
             └── archivo server-side primy_draw_results
```

Los endpoints de la app nunca exponen `SUPABASE_SERVICE_ROLE_KEY`. El navegador solo utiliza la clave publicable y accede a sus tablas de usuario mediante RLS.

## Configuración

### Variables de Vercel

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
```

Opcionales:

```text
SUPABASE_URL                 # usa VITE_SUPABASE_URL o la URL integrada si se omite
SELAE_BASE_URL               # solo para pruebas o proxy controlado
RESULT_CACHE_TTL_MINUTES     # 30 por defecto
```

`LOTERIA_API_KEY` ya no se utiliza y puede eliminarse de Vercel.

### Base de datos

Ejecuta en Supabase SQL Editor, después de las migraciones anteriores:

```text
supabase/migrations/20260730_create_primy_draw_results.sql
```

La tabla de resultados no tiene políticas para `anon` ni `authenticated`: solo las funciones server-side acceden mediante `service_role`.

### Sincronización automática

`vercel.json` programa `/api/sync-results` cada día a las 22:15 UTC. Vercel envía `Authorization: Bearer <CRON_SECRET>` cuando la variable está configurada.

### Importación histórica inicial

Con las variables server-side disponibles en el terminal:

```bash
npm run backfill:selae -- --game=all --from=2016-01-01
```

También puedes importar un solo juego o un intervalo reducido:

```bash
npm run backfill:selae -- --game=primitiva --from=2024-01-01 --to=2026-07-30
```

La importación consulta solo fechas oficiales de sorteo, omite las ya archivadas, guarda por lotes y puede reanudarse.

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
