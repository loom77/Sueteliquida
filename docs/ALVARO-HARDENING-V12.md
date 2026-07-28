# Refuerzo técnico de Alvaro — Primy v12

## Objetivo

Reforzar Primy para producción sin reescribir el motor ni el flujo UX.

## Cambios

- Barrera global de errores.
- Registros JSON y `X-Request-Id`.
- Validadores específicos por juego y fecha.
- Cortacircuitos para el proveedor externo.
- Cabeceras de seguridad y HSTS.
- Semilla persistente para reproducibilidad.
- Carga diferida de vistas.
- Pruebas técnicas adicionales.

## Pendientes recomendados

Compilación de producción, pruebas de extremo a extremo, Lighthouse, axe y revisión en dispositivos reales.
