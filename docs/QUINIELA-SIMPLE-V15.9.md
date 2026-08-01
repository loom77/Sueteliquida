# Primy v15.9.0 — Quiniela simple operativa

## Alcance aprobado

Esta versión activa exclusivamente la preparación de **una apuesta simple de La Quiniela**:

- jornada oficial recuperada desde el archivo deportivo de Primy;
- catorce pronósticos `1-X-2`;
- Pleno al 15 con `0`, `1`, `2` o `M`;
- coste unitario de 0,75 €;
- guardado como borrador no comprado.

## Integridad de la jornada

El pronóstico conserva:

- `roundId`;
- número oficial de jornada;
- revisión;
- `sourceHash`;
- fecha de jornada;
- composición ordenada de los quince partidos;
- snapshot completo de la fuente deportiva.

Una composición con menos o más de quince partidos se rechaza. Primy no inventa equipos, posiciones ni horarios.

## Persistencia

La jugada deportiva utiliza un modelo propio dentro del archivo general:

```js
{
  gameId: 'quiniela',
  betType: 'simple',
  equivalentBets: 1,
  columns: [{ signs: ['1', 'X', ...], pleno: { home: 'M', away: '1' } }],
  roundId: '...',
  roundRevision: 2,
  roundSourceHash: '...',
  matches: [...],
  purchased: false,
  status: 'draft'
}
```

La sanitización rechaza deliberadamente una Quiniela marcada como comprada: el registro de compra todavía no pertenece a este milestone.

## UX

- selettori grandi e accessibili;
- costo e avanzamento sempre visibili;
- Pleno al 15 separato visivamente;
- riepilogo dedicato nel pannello di anteprima;
- dettaglio sportivo specifico nell'Archivio;
- nessun pulsante di acquisto, ripetizione o verifica.

## Funzioni ancora bloccate

- acquisto/registrazione del boleto;
- verifica ufficiale e scrutinio;
- doppie e triple;
- Elige8;
- ridotte ufficiali;
- condizionate;
- suggerimenti probabilistici automatici.
