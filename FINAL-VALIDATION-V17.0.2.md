# Final validation — Primy v17.0.2

## Correzioni

- La preferenza di gioco predefinita viene applicata una sola volta all'avvio e non sovrascrive più il gioco scelto dall'utente dopo il reset di una giocata.
- Quinigol resta nel proprio pannello e, in assenza di composizione verificata, mostra lo stato `Jornada en actualización`.
- Lototurf e Quíntuple Plus mostrano lo stato reale `Sin jornada hípica activa` nell'intestazione quando non esiste un programma ufficiale.
- Eliminato il secondo pulsante di aggiornamento ridondante nelle schermate sportive e ippiche.

## Verifica

- `npm test`: 220 test superati, 0 fallimenti.
- Test di regressione aggiunti per routing, disponibilità e versione.
- `npm run build` non eseguito: nell'ambiente di validazione non sono installate le dipendenze npm e il comando `vite` non è disponibile.
