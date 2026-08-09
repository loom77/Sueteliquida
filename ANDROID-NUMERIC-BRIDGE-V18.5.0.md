# PRIMY Web v18.5.0 — Android Numeric Games Bridge

This checkpoint keeps the web app as the canonical broad implementation while widening the Android-compatible data contract to five numeric games:

- La Primitiva
- Bonoloto
- Euromillones
- El Gordo de la Primitiva
- EuroDreams

## Contract rules

- `drawDateKey` is immutable after save and is the only official draw accepted for verification.
- Euromillones stores `secondaryNumbers` (two stars) per column.
- El Gordo stores `extra` (Clave) per column; it is never treated as a receipt-level reintegro.
- EuroDreams stores `extra` (Sueño) per column; deferred top prizes are not counted as cash winnings.
- Bonoloto still requires the real receipt reintegro before a play can be marked purchased.
- The web signup remains disabled; Android signup remains enabled.

Data contract version: **18.5.0**.
