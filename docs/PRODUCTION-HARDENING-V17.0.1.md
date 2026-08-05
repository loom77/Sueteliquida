# Primy v17.0.1 — Production Hardening

## Obiettivo

Correggere l'associazione errata tra identità della giornata e composizione sportiva, rappresentare formalmente il Pleno al 15 e rimuovere il percorso query legacy che generava il warning Node `DEP0169` in produzione.

## Modello sportivo

- Ogni incontro dichiara `predictionType`.
- Quiniela posizioni 1–14: `one-x-two`.
- Quiniela posizione 15: `pleno15`.
- Quinigol posizioni 1–6: `score-buckets`.
- La validazione blocca posizioni mancanti, posizioni duplicate, coppie casa/trasferta duplicate e ruoli incompatibili.
- I vecchi snapshot privi del campo vengono normalizzati in modo retrocompatibile in base a gioco e posizione.

## Sincronizzazione ufficiale

La funzione Supabase `sync-sports-rounds` usa il parser `sports-checker-v8` e separa due verifiche:

1. identità della fonte: numero e/o data devono coincidere con la giornata attesa;
2. composizione: conteggio, posizioni, duplicati e tipo di pronostico devono essere validi.

La Quiniela 76 dispone di uno snapshot pubblicato e verificato, con scadenza al termine della vendita. Quinigol 88 non usa più la composizione della giornata precedente come fallback: resta in stato `updating` finché la fonte non identifica e pubblica correttamente la giornata 88.

## API

Le API leggono i parametri con `URL` e `URLSearchParams` tramite `requestSearchParams(req)`. Non accedono più a `req.query`, eliminando la dipendenza dal parser URL legacy del runtime.

## UX

Il pannello, l'anteprima e l'Archivio della Quiniela risolvono gli incontri per ruolo, non per indice implicito. Il Pleno al 15 è etichettato esplicitamente come marcatore `0/1/2/M`.

## Migrazione richiesta

Applicare `supabase/migrations/20260805_sports_identity_hardening_v1701.sql` prima o insieme al deployment. La migrazione elimina gli snapshot v7 non verificati e rafforza il trigger di validazione delle giornate sportive.
