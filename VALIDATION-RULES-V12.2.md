# Primy v12.2 — Validazione regole di gioco

## Correzioni

- La Primitiva: un solo Reintegro assegnato al resguardo, non uno per colonna.
- La Primitiva: il Reintegro restituisce l'importo giornaliero totale del resguardo una sola volta.
- EuroDreams: ogni giocata semplice è composta da 6 numeri e un Sogno; il Sogno resta associato alla singola colonna.
- Massimi per boleto semplice: 8 colonne La Primitiva e 6 colonne EuroDreams.

## Aree aggiornate

- Motore di generazione
- Modello dati e migrazione storico
- Inserimento manuale
- Anteprima schedina
- Storico e verifica premi
- Test automatici

## Nota

Primy genera soltanto giocate semplici. Le giocate multiple combinatorie SELAE non sono ancora implementate e non vengono presentate come tali.
