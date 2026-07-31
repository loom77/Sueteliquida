# Primy v15.5.2 — Verificación de sorteos hotfix

## Incidente corregido

La jugada EuroDreams del 30/07/2026 quedó temporalmente sin resultado porque el cron de Supabase estaba programado a las 22:45 UTC, fuera de la ventana real de publicación en Madrid.

Además, el comparador de categorías podía asociar una coincidencia genérica como `6` a la primera fila que contuviera ese número. Esto provocó que una jugada con 2 aciertos tomara el importe de la primera categoría (0) en lugar de la sexta categoría (2,50 €).

## Correcciones

- cron SELAE reprogramado cada 15 minutos entre las 19:00 y las 21:59 UTC;
- sincronización manual del sorteo EuroDreams del 30/07/2026;
- asociación de premios basada en la categoría exacta y en una puntuación de coincidencia;
- corrección de la jugada afectada en Supabase a 2,50 €;
- prueba de regresión con el resultado real del 30/07/2026.

## Validación

- 88 pruebas superadas;
- 0 pruebas fallidas;
- endpoint de producción `/api/check-results?game=eurodreams&dates=2026-07-30` verificado con resultado disponible;
- build Vite no ejecutada porque el registry del entorno no contiene `@supabase/supabase-js@2.57.4`.
