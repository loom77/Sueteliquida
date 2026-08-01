# Validación final — Primy v15.3.1

## Incidencia corregida

El color `sky` estaba definido como un único valor en Tailwind. Esa definición sustituía la paleta nativa y hacía inexistentes utilidades como `bg-sky-700`, provocando que el selector y la CTA de Euromillones mostrasen texto blanco sin fondo visible.

## Corrección

- Paleta `sky` completa con `DEFAULT` y tonos 50–950.
- Clase de seguridad `.primy-euromillones-action` con contraste explícito.
- CTA identificable mediante `data-game-action` y `aria-label` específico.
- Cache PWA actualizada a v15.3.1.
- Pruebas de regresión añadidas.

## Regla de publicación

Un juego solo se declara operativo tras validar reglas, motor, persistencia, comprobación de resultados y render visual de todas las acciones críticas.
