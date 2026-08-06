# FINAL VALIDATION — PRIMY v18.0.1

## Correzione verificata
- Il totale premi richiede categoria, importo positivo e fonte confermata.
- Un importo storico privo di fonte, incluso `1359.59`, produce totale `0`.
- Premi manuali e ufficiali confermati vengono sommati correttamente.
- La 12.ª categoria di Euromillones non può essere confusa con la 2.ª.
- La fonte del premio sopravvive alla sanitizzazione e alla persistenza.

## Test dedicati
`tests/prizeIntegrityV18_0_1.test.js`

## Release
`18.0.1`
