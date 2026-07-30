# Proveedor oficial SELAE — Primy v15.1

## Decisión del equipo

Primy deja de depender de una cuota mensual de LoteriasAPI. Los resultados de La Primitiva y EuroDreams se obtienen de los ficheros que SELAE publica para incorporar los últimos sorteos en sitios externos.

## Flujo de datos

1. `_selaeProvider.js` descarga el fichero oficial de la fecha solicitada.
2. El parser exige seis números válidos y los extras propios de cada juego.
3. Se comprueba que la fecha recibida coincida con la solicitada.
4. `_drawRepository.js` guarda el resultado en `primy_draw_results` mediante `service_role`.
5. Las siguientes consultas leen la copia archivada y no repiten la petición externa.
6. `/api/sync-results` completa diariamente los sorteos recientes.

## Resiliencia

- timeout y circuit breaker;
- caché persistente en Supabase y fallback temporal en memoria;
- hash SHA-256 del documento oficial;
- rechazo de respuestas incompletas o de una fecha distinta;
- compatibilidad EDMS/EUDR para EuroDreams;
- comprobación por fecha limitada a 31 sorteos por solicitud;
- importación histórica reanudable y con pausa entre peticiones.

## Secretos

- `SUPABASE_SERVICE_ROLE_KEY`: solo servidor, nunca `VITE_*`.
- `CRON_SECRET`: protege la sincronización programada.
- No se necesita una clave SELAE ni `LOTERIA_API_KEY`.

## Despliegue

1. Aplicar `20260730_create_primy_draw_results.sql`.
2. Añadir `SUPABASE_SERVICE_ROLE_KEY` y `CRON_SECRET` en Vercel.
3. Desplegar.
4. Ejecutar opcionalmente `npm run backfill:selae -- --game=all --from=2016-01-01` desde un entorno con acceso a internet.
5. Verificar `/api/provider-status` e `/api/sync-results`.
