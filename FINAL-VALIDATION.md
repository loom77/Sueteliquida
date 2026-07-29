# Primy v14.0.0 — Final validation

Data: 29 luglio 2026

## Contenuto della release

- Premium Home Experience modulare.
- Nuovo sistema visuale Primy Fold / Signal Gold.
- Mascotte responsive e onboarding aggiornato.
- Create & Result Experience con avanzamento, conferme e protezione dalle azioni involontarie.
- Archivio con filtri rapidi, ordinamento per azione necessaria e dettaglio premium delle giocate.
- Pagina pubblica di gioco responsabile e aggiornamenti PWA.
- Motore matematico e regole di dominio mantenuti invariati.

## Verifiche eseguite

- `npm test`: 44 test superati, 0 falliti.
- Archivio completo del progetto preparato senza `node_modules` e senza file temporanei.

## Build

La build Vite non è stata eseguita in questo ambiente perché il registry npm interno non rende disponibile `@supabase/supabase-js@2.57.4`. Il comando di installazione fallisce con errore 404 prima di installare Vite. Questo non costituisce una prova di errore del sorgente; la build va eseguita in un ambiente npm standard con accesso al registry pubblico.

Comandi consigliati:

```bash
npm install
npm test
npm run build
```
