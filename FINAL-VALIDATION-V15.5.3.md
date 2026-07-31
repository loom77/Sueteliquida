# Primy v15.5.3 — Primy Core accesso dalla home

## Modifica UX

- La parte alta della home mostra il pulsante evidente **“Cómo funciona Primy Core”**.
- Il pulsante apre lo stesso popup disponibile nella schermata di creazione.
- Il popup è stato estratto nel componente condiviso `src/components/PrimyCoreDialog.jsx`.
- Apertura, chiusura, gestione del focus, tasto Escape e contenuto restano uniformi in entrambe le pagine.

## Integrità funzionale

- La base è Primy v15.5.2.
- L’hotfix della verifica EuroDreams e la relativa logica di associazione dei premi sono preservati.
- El Gordo de la Primitiva resta integrato.
- Cache PWA e versione di persistenza aggiornate a v15.5.3.

## Verifiche eseguite

- 89 test superati, 0 falliti.
- 106 file JS/JSX/TS analizzati senza errori sintattici.
- 0 importazioni locali mancanti.
- CSS principale analizzato correttamente.
- La build Vite non è stata eseguita in questo ambiente perché il registry interno non rende disponibile `@supabase/supabase-js`; il codice sorgente e la suite automatica risultano validi.
