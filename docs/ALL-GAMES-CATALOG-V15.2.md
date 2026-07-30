# Primy v15.2 — Fundación del catálogo completo

## Decisión conjunta

El equipo aprueba una página única de selección denominada **Juegos**, organizada por familias y respaldada por un registro declarativo de capacidades.

La página no intenta convertir todos los juegos en variantes del mismo generador. Cada ficha declara su modelo de boleto y mantiene bloqueadas las acciones que todavía no han superado la validación completa.

## Estructura implementada

- Ruta principal: `/juegos`.
- Compatibilidad conservada: `/explorar` redirige a la misma vista.
- Diez juegos catalogados.
- Cuatro familias funcionales.
- Búsqueda por nombre, descripción o modelo de boleto.
- Filtros por familia.
- Estado visible por juego.
- Capacidades visibles y bloqueadas cuando todavía no están disponibles.

## Capabilities

Cada juego declara:

- `createCombination`
- `manualEntry`
- `resultChecking`
- `history`
- `statisticalLab`
- `officialData`

La interfaz consume estas capacidades y no infiere funciones por el nombre o la familia del juego.

## Estado inicial

Operativos:

- La Primitiva.
- EuroDreams.

En validación de reglas:

- Euromillones.
- Bonoloto.
- El Gordo de la Primitiva.

En definición arquitectónica:

- Lotería Nacional.
- La Quiniela.
- El Quinigol.
- Lototurf.
- Quíntuple Plus.

## Siguiente gate

El siguiente bloque debe producir una ficha funcional independiente para cada juego antes de escribir su motor. La primera familia recomendada para implementación es **loterías de números**, empezando por Euromillones, porque comparte parte de la infraestructura de combinaciones sin ser una copia de La Primitiva.
