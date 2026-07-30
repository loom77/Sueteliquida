# Primy v15.3 — Euromillones operativo

## Decisión conjunta del equipo

- **Yuma** aprueba el flujo de creación, registro manual, archivo y comprobación con dos grupos visuales: cinco números y dos estrellas.
- **Alvaro** aprueba el modelo de datos `secondaryNumbers`, separado del campo escalar usado por Sueño o Reintegro.
- **David/Euler** valida la generación uniforme independiente y las trece categorías de premio. El historial sigue siendo descriptivo y no modifica la combinación generada.
- **Nico** aprueba una identidad azul propia dentro del sistema Primy Grid, sin romper la estructura compartida.

## Reglas implementadas

- 5 números distintos del 1 al 50.
- 2 estrellas distintas del 1 al 12 por apuesta simple.
- Hasta 5 apuestas simples en el mismo boleto dentro de Primy.
- Precio unitario configurado: 2,50 €.
- Sorteos: martes y viernes a las 21:00, zona `Europe/Madrid`.
- Comprobación mediante las 13 categorías oficiales de coincidencias de números y estrellas.

## El Millón

Primy no genera códigos de El Millón. Cuando exista un código en un resguardo real, puede conservarse como referencia externa; no interviene en la combinación ni en la comprobación de las trece categorías de Euromillones.

## Datos oficiales

La sincronización programada archiva en Supabase:

- `winning_numbers`: cinco números;
- `secondary_numbers`: dos estrellas;
- tabla de premios;
- bote publicado;
- fecha y huella de la fuente.

La aplicación consulta Supabase durante el uso normal. SELAE se consulta únicamente desde la sincronización programada.
