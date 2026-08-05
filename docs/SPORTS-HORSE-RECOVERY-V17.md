# Primy v17.0.0 — Sports & Horse Recovery

## Obiettivo

La release elimina gli stati fuorvianti dei giochi sportivi e hípici, completa il primo flusso operativo di El Quinigol e sposta la sincronizzazione hípica dentro Supabase.

## Stati funzionali

Primy distingue ora:

- **Disponibile**: composizione completa, identità ufficiale, data e chiusura verificate.
- **In aggiornamento**: il gioco esiste, ma la composizione non supera ancora la validazione.
- **Nessuna giornata attiva**: la fonte ufficiale non ha pubblicato un programma utilizzabile.
- **Vendita chiusa**: la giornata resta consultabile ma non accetta nuove preparazioni.
- **Cancellata/finalizzata**: stato ufficiale non operativo per nuove giocate.

L’assenza di una giornata non viene più trattata come un errore HTTP del motore.

## La Quiniela

- rimosse le righe provvisorie `quiniela:current`;
- bloccati nomi squadra con URL, Markdown o contaminazioni della pagina;
- obbligatori numero di giornata, data, chiusura vendite, source hash e 15 incontri;
- composizione collegata alla giornata ufficiale;
- registrazione come acquistata e verifica unificata disponibili.

## El Quinigol

Nuovo modulo operativo:

- sei incontri ufficiali;
- matrice 4×4 per i valori `0`, `1`, `2`, `M`;
- una previsione per ogni squadra e incontro;
- costo unitario di 1 €;
- anteprima, salvataggio, archivio, registrazione acquisto e verifica unificata;
- snapshot della giornata, revisione e impronta della fonte conservati nella giocata;
- fallback con snapshot ufficiale verificato e scadenza automatica, utilizzato solo quando il reader non restituisce la composizione completa.

## Lototurf e Quíntuple Plus

- sincronizzatore Supabase dedicato `sync-horse-rounds`;
- eliminata la dipendenza dal vecchio endpoint Vercel `/api/sync-horse-rounds`;
- ricerca del programma ufficiale SELAE e parsing di giornate, corse, partecipanti e ritirati;
- convalida server-side prima della scrittura;
- nessuna giornata inventata quando SELAE non pubblica il programma;
- interfaccia con stato controllato “Sin jornada hípica activa”.

## Protezioni database

La migrazione `20260805_sports_horse_recovery_v170.sql`:

- elimina dati sportivi provvisori o privi di identità;
- impedisce la scrittura di giornate sportive incomplete o contaminate;
- impedisce la scrittura di programmi hípici con corse o partecipanti non validi;
- mantiene le funzioni di validazione non eseguibili da client anonimi o autenticati.

## Edge Functions

- `scheduled-sync-all-results`
- `sync-sports-rounds`
- `sync-horse-rounds`
- `sync-loteria-nacional`

La sincronizzazione Fast continua a orchestrare numeri, Lotería Nacional, calcio e hípica con frequenze differenziate.

## Limitazione esterna corrente

Quando SELAE non pubblica un programma hípico scaricabile, Lototurf e Quíntuple Plus rimangono correttamente bloccati. Questo è uno stato della fonte, non un errore dell’app o del database.
