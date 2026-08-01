# Primy v16.1.0 — Creative Restyle

## Objetivo

Corregir solapamientos y falta de personalidad detectados en Preparar, Juegos, Archivo y Perfil sin modificar las reglas de juego ni la persistencia.

## Decisiones visuales

- El verde Primy sigue siendo el color de las acciones principales.
- Cada juego utiliza un acento original y centralizado para identificación, no como sustituto de la marca.
- El selector de juegos utiliza tarjetas legibles y responsive; nunca comprime siete nombres en una fila.
- El catálogo reduce el ruido técnico a tres acciones: Preparar, Registrar y Más opciones.
- El Archivo incorpora color por juego y prioriza lo que requiere atención.
- El Perfil combina cuenta, preferencias, límite responsable y seguridad en una experiencia personal.
- La mascota aparece como protagonista únicamente cuando tiene una función: companion o thinking.

## Secuencia de preparación

La generación automática conserva su resultado matemático inmediato, pero el reveal visual se produce tras un mínimo de 4.000 ms:

1. Revisando las reglas del juego.
2. Comprobando el coste y tus límites.
3. Preparando la combinación.
4. Haciendo la última revisión.

Los errores se muestran inmediatamente y `prefers-reduced-motion` elimina movimiento innecesario, pero no salta las validaciones ni el estado de proceso.

## Integridad

No se han modificado motores probabilísticos, reglas oficiales, proveedores, tablas ni modelos persistentes.
