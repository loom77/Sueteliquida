# Draw Selection & Data Contract — v18.4.0

## Principio
Una jugada no pertenece a «la próxima extracción» de forma dinámica. Pertenece a una extracción concreta elegida al crearla.

## Identidad de una jugada numérica
Campos mínimos:

- `gameId`
- `drawDateKey` — fecha Madrid `YYYY-MM-DD`
- `drawDateISO`
- `drawDateTimeISO`
- `salesCloseISO`
- `checkableFromISO`
- `dataContractVersion`

La verificación consulta exactamente `gameId + drawDateKey`.

## Flujo
1. Usuario elige juego.
2. Primy calcula los próximos sorteos cuya venta/preparación todavía está abierta.
3. Usuario elige una fecha; por defecto queda marcada la primera.
4. La fecha se envía al worker junto con la configuración de generación.
5. El motor vuelve a validar que esa fecha pertenece al juego y sigue abierta.
6. La jugada generada conserva la fecha exacta.
7. Al registrar el boleto, la fecha no se recalcula.
8. Cuando llega `checkableFromISO`, el archivo consulta el resultado oficial de `drawDateKey`.

## Caso de referencia
Sábado 8/08/2026 21:25 Europe/Madrid:

- Sorteo La Primitiva 8/08/2026 21:40: cerrado para preparación desde 21:15.
- Primer sorteo ofrecido: lunes 10/08/2026.
- Segundo sorteo ofrecido: jueves 13/08/2026.
- Si el usuario elige 13/08, la jugada conserva `drawDateKey = 2026-08-13` y solo se verifica contra el resultado oficial del 13/08.

## Deportes e hípica
Estas familias se identifican por jornada/programa oficial, no por un calendario semanal inferido. El contrato prioriza `roundId`; la fecha sirve de respaldo. No se inventan jornadas futuras que el proveedor oficial todavía no haya publicado.
