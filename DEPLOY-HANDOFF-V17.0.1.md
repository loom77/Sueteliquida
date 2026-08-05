# Deployment handoff — Primy v17.0.1

## Stato

Il backend sportivo v8 e la migrazione di hardening sono già attivi su Supabase. Resta da pubblicare il codice applicativo nel repository `loom77/Sueteliquida`, branch `main`, per avviare il deployment Vercel del frontend e delle API.

## Commit consigliato

`Release Primy v17.0.1 Production Hardening`

## Verifiche dopo il push

1. Vercel deve completare la build senza errori.
2. La homepage deve mostrare release `17.0.1`.
3. La meta description deve includere Quiniela, Quinigol e giochi hípicos.
4. `/api/sports-rounds?game=quiniela` deve restituire la Jornada 76 con 15 incontri.
5. `/api/sports-rounds?game=quinigol` deve restituire `updating` finché non è disponibile la composizione verificata della Jornada 88.
6. I runtime logs non devono più generare nuovi warning `DEP0169` sulle route aggiornate.
