# Primy v11 — deep research e benchmark di prodotto

## Obiettivo

Portare Primy sopra i generatori statistici concorrenti nella chiarezza e nella trasparenza, avvicinandola alle migliori app operative nella velocità del ciclo “crea → registra → verifica”.

## Cosa premiano gli utenti delle app leader

Le applicazioni più forti non vincono perché espongono più algoritmi. Vincono perché riducono il lavoro dell’utente:

- scanner e verifica immediata;
- jackpot e prossima estrazione visibili;
- schedine conservate;
- notifiche contestuali;
- azione primaria riconoscibile;
- risultato e importo leggibili in pochi secondi.

I generatori statistici più complessi ricevono invece critiche quando numeri, filtri e segnali grafici diventano difficili da interpretare.

## Decisioni applicate in v11

### 1. Prestazioni percepite

La dashboard non carica più dieci anni di storico. Un endpoint aggregato recupera i dati essenziali iniziali, mentre lo storico viene richiesto soltanto nella generazione o su comando esplicito.

### 2. Calendario affidabile

Tutte le date sono calcolate in `Europe/Madrid`. Chiusura, sorteggio e pubblicazione non vengono più confusi. Questo elimina errori quando il dispositivo usa un altro fuso.

### 3. Navigazione da vera web app

Le viste hanno URL distinti, supportano ricarica, bookmark e pulsanti avanti/indietro.

### 4. Accessibilità operativa

Dialoghi con gestione completa del focus, controlli principali da almeno 44 px, focus visibile, motion reduction, lettura vocale delle colonne e layout mobile senza scroll annidati.

### 5. Fiducia

Il lettore del resguardo non viene presentato come scanner completo. La UI dichiara cosa acquisisce, cosa richiede conferma e quando la fotocamera viene usata. I dettagli interni del provider non vengono esposti nelle risposte pubbliche.

### 6. Resilienza PWA

Stato offline esplicito, cache delle informazioni già viste e aggiornamento controllato dall’utente, evitando che il service worker sostituisca la versione durante un’operazione.

### 7. Scalabilità serverless

Rate limiting distribuito opzionale con Upstash e cache CDN. Il fallback in memoria resta disponibile per uso personale.

## Dove Primy v11 supera i generatori concorrenti

- una sola generazione automatica invece di molti filtri da configurare;
- portafogli multicolonna coordinati;
- esclusione automatica dei modelli storici non validati;
- nessun punteggio presentato come probabilità di vincita;
- nessuna pubblicità e nessun account obbligatorio;
- controllo locale della spesa;
- UX più semplice di molti strumenti statistici.

## Dove non è ancora superiore alle app commerciali mature

- scansione completa e certificata del boleto;
- push notification in background;
- sincronizzazione cifrata fra dispositivi;
- supporto di molti giochi;
- migliaia di sessioni reali e recensioni pubbliche;
- test certificati su un ampio parco dispositivi.

## Prossimo livello dopo v11

1. test moderati con 5–8 utenti e misurazione dei task;
2. Lighthouse, axe e visual regression in CI;
3. lockfile e build riproducibile con `npm ci`;
4. parser ufficiale o partnership per la scansione dei resguardi;
5. push backend opt-in, senza promozioni di gioco;
6. IndexedDB per dataset storici più grandi;
7. benchmark pubblico pre-registrato del motore;
8. localizzazione completa italiano/spagnolo;
9. telemetria privacy-first facoltativa, solo con consenso;
10. audit legale e di gioco responsabile prima di una distribuzione pubblica ampia.

## Conclusione

La v11 non dichiara di essere oggettivamente “la migliore” senza dati reali. È però progettata per competere su un terreno più difendibile: generazione coordinata, privacy, trasparenza, accessibilità e affidabilità del flusso operativo.
