# Primy v16.6 — Datos oficiales hípicos

## Alcance

Esta versión conecta la base matemática de Lototurf y Quíntuple Plus con documentos oficiales de SELAE.

## Fuentes

- Página oficial del programa de Lototurf.
- Página oficial del programa de Quíntuple Plus.
- Documentos PDF del programa de carreras.
- Documentos oficiales de caballos retirados.
- Ficheros HTML oficiales de resultados por juego y fecha.

## Flujo

```text
Página oficial SELAE
        │
        ├── descubre PDF de programa
        ├── descubre PDF de retirados
        └── consulta resultado por fecha
                    │
                    ▼
       extracción de texto PDF server-side
                    │
                    ▼
        parser y validación estricta
                    │
                    ▼
   primy_horse_rounds + revisiones
```

## Seguridad

- La clave `service_role` solo puede existir en el entorno server-side.
- El navegador utiliza exclusivamente la clave publicable de Supabase.
- La sincronización puede protegerse con `CRON_SECRET`.
- No se inventan dorsales ni carreras cuando el documento no puede interpretarse.

## Endpoints

```text
GET /api/horse-rounds?game=lototurf
GET /api/horse-rounds?game=quintuple-plus
GET /api/horse-rounds?game=lototurf&roundId=...
GET /api/horse-rounds?game=lototurf&from=YYYY-MM-DD&to=YYYY-MM-DD
POST /api/sync-horse-rounds
```

## Limitaciones

La extracción de PDF funciona con documentos que contienen texto. Si SELAE publica un documento escaneado o cambia su codificación, Primy bloquea la importación en lugar de inferir participantes. La UX de creación de apuestas hípicas permanece desactivada hasta que programas, retirados y resultados se verifiquen sobre una muestra suficiente de jornadas reales.
