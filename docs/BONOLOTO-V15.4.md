# Primy v15.4 — Bonoloto operativo

## Alcance aprobado por el equipo

Bonoloto queda habilitada únicamente después de validar de forma conjunta producto/UX, arquitectura, reglas, diseño, persistencia y datos oficiales.

## Reglas implementadas

- 6 números distintos del 1 al 49.
- 0,50 € por apuesta.
- Mínimo de 2 apuestas sencillas por boleto de un solo sorteo.
- Máximo de 8 apuestas sencillas.
- Sorteo diario.
- Complementario y reintegro oficiales.
- El reintegro es copiado del resguardo al registrar la compra; Primy no lo genera.

## Múltiples

| Selección | Apuestas equivalentes | Coste por sorteo |
|---:|---:|---:|
| 5 | 44 | 22,00 € |
| 7 | 7 | 3,50 € |
| 8 | 28 | 14,00 € |
| 9 | 84 | 42,00 € |
| 10 | 210 | 105,00 € |
| 11 | 462 | 231,00 € |

La selección se guarda una sola vez. Las combinaciones de seis números se desarrollan únicamente al comprobar el resultado, evitando inflar el archivo y la sincronización del usuario.

La modalidad de cinco números aplica la regla especial: los cinco números elegidos se combinan con cada uno de los 44 números restantes.

## Categorías de comprobación

1. 6 números.
2. 5 números + complementario.
3. 5 números.
4. 4 números.
5. 3 números.
6. Reintegro del resguardo.

En una múltiple, Primy evalúa todas las apuestas equivalentes, agrupa el número de premios por categoría y suma solo importes oficiales conocidos.

## Fuente de datos

La sincronización programada lee el resultado oficial, lo valida y lo guarda en `public.primy_draw_results`. Las sesiones de usuario leen Supabase y no consultan SELAE directamente.

## Gate de calidad

- CTA visible en tema claro y oscuro.
- Operación completa desde 320 px.
- Navegación por teclado y etiquetas accesibles.
- Coste, persistencia y reintegro verificados.
- Múltiples probadas hasta 462 apuestas.
- Parsing de números, complementario y reintegro probado.
- No se usa el histórico para alterar la generación uniforme.
