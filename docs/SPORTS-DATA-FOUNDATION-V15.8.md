# Primy v15.8.0 — Proveedor oficial y archivo versionado de jornadas deportivas

## Alcance

Este hito conecta la fundación matemática deportiva con una capa de datos oficial, persistente y auditable. La creación de boletos continúa bloqueada.

## Fuente oficial

Primy consulta las páginas oficiales de comprobación de SELAE para recuperar la composición vigente de:

- La Quiniela: `/es/resultados/quiniela/comprobar`
- El Quinigol: `/es/resultados/quinigol/comprobar`

El parser exige exactamente 15 partidos para La Quiniela y 6 para El Quinigol. Si la fuente está incompleta o cambia de estructura, la sincronización falla de forma explícita y no inventa equipos.

## Archivo persistente

`primy_sports_rounds` conserva el snapshot vigente de cada jornada. `primy_sports_round_revisions` conserva cada composición distinta mediante la pareja `round_id + source_hash`.

Cada snapshot conserva:

- juego, temporada, número y fecha de jornada cuando están disponibles;
- estado operativo;
- apertura y cierre de ventas cuando SELAE los publique;
- fuente, URL, hash, hora de consulta y revisión;
- composición ordenada del boleto;
- metadatos del parser.

## Sincronización

La Edge Function `sync-sports-rounds` usa la clave `service_role` únicamente dentro de Supabase. Dos tareas `pg_cron` solicitan la sincronización por la mañana y por la tarde. Vercel solo expone un proxy limitado para solicitar una actualización manual.

## Endpoints

- `GET /api/sports-rounds?game=quiniela`
- `GET /api/sports-rounds?game=quinigol`
- `GET /api/sports-rounds?game=quiniela&roundId=...`
- `GET /api/sports-rounds?game=quiniela&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/sync-sports-rounds`

## Gate pendiente

1. UX completa del boleto de La Quiniela.
2. UX 4×4 del Quinigol.
3. persistencia de pronósticos del usuario;
4. comprobación de resultados, exclusiones y escrutinio;
5. importación y verificación de matrices reducidas oficiales;
6. calibración del modelo con histórico real.
