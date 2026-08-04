# Primy v16.5 — Base matemática de apuestas hípicas

## Alcance

Esta milestone establece la capa matemática y reglamentaria de los dos juegos hípicos pendientes: Lototurf y Quíntuple Plus. Las acciones de preparación siguen bloqueadas hasta integrar el programa oficial de carreras y la persistencia específica de la jornada.

## Lototurf

- 6 números del 1 al 31.
- 1 caballo del 1 al 12 por apuesta simple.
- De 1 a 6 apuestas simples por boleto.
- Múltiples autorizadas: 6–10 números y 1–4 caballos.
- Apuestas equivalentes: C(n,6) × h, máximo 840.
- Siete categorías y reintegro separado.
- Sustitución por dorsal anterior con vuelta al dorsal máximo cuando un caballo se retira.

## Quíntuple Plus

- Ganador de las cinco primeras carreras.
- Segundo clasificado de la quinta carrera.
- Entre 3 y 20 participantes por carrera.
- Apuestas simples y múltiples.
- La quinta carrera excluye pares imposibles en los que el mismo caballo sea primero y segundo.
- Máximo de 65.535 apuestas por boleto.
- Cuatro categorías; la categoría especial depende del escrutinio global y no puede determinarse desde una apuesta aislada.

## Gate pendiente

1. Importación del programa oficial de carreras.
2. Identificadores de jornada y dorsales vigentes.
3. UX específica para selecciones hípicas.
4. Persistencia y revisión de cambios/retiradas.
5. Resultados oficiales y escrutinio.
6. QA sobre jornadas reales.

## Fuente reglamentaria

Normas que regulan los juegos Lototurf y Quíntuple Plus, SELAE, junio de 2026.
