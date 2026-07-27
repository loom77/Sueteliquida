## 12.2.0 — Correzione regole SELAE

- La Primitiva ora usa un solo Reintegro per l'intero resguardo, condiviso da tutte le colonne.
- Il premio Reintegro viene calcolato una sola volta sull'importo totale giocato nel sorteggio.
- EuroDreams mantiene un numero Sogno distinto per ogni giocata semplice.
- Limiti per singolo boleto: 8 giocate semplici La Primitiva, 6 EuroDreams.
- Inserimento manuale, anteprima, storico, migrazione dati e verifica premi allineati al nuovo modello.

# Changelog

## 11.0.0 — Production UX Edition

- Routing reale con cronologia del browser e deep link Vercel.
- Fuso orario unico `Europe/Madrid` con test su ora solare e legale.
- Separazione di chiusura vendite, sorteggio e pubblicazione risultati.
- Corretto EuroDreams: chiusura 20:30, sorteggio 21:00, risultato programmato 21:40.
- Endpoint aggregato `/api/bootstrap` per eliminare chiamate iniziali duplicate.
- Caricamento storico on demand e richieste cancellabili.
- Worker del motore persistente e messaggi protetti da `requestId`.
- Rate limiting distribuito opzionale tramite Upstash REST.
- Fotocamera arrestata in ogni percorso di chiusura del dialogo.
- Dialoghi accessibili con focus trap, Escape, scroll lock e focus restore.
- Onboarding iniziale riapribile dalle impostazioni.
- Design token semantici per tema chiaro e scuro.
- Tabella desktop dedicata per le giocate e card mobile.
- Lettura vocale delle colonne generate.
- Banner offline e aggiornamento PWA richiesto all’utente.
- Storage `primy_plays_v11`, backup versione 11 e campo `purchasedAt`.
- 30 test automatici superati, inclusi cinque test sul calendario di Madrid.

## 10.0.1 — separazione hit-rate / anti-condivisione

- Rimosso equilibrio strutturale e anti-condivisione dal ranking predittivo.
- In assenza di evidenza storica tutte le combinazioni valide restano neutrali.
- La selezione multicolonna ottimizza copertura e sovrapposizione; i pattern umani restano solo diagnostici.
- Il pool candidati viene ordinato per probabilità soltanto quando un modello ha superato il gate fuori campione.

## 10.0.0 — Evidence Engine

- Ensemble Bayes, recenza, lungo/breve periodo e KNN.
- Backtest walk-forward con baseline casuale a pari budget.
- Bootstrap a blocchi e soglia conservativa per confronti multipli.
- Fallback automatico al casuale uniforme.
- Ottimizzazione multicolonna con copertura pesata e ricerca locale.

## v11.1 — Yuma UX/UI governance
- Aggiunto il ruolo ufficiale Yuma UX/UI al processo di sviluppo.
- Aggiunte checklist di review, principi di design, template audit e Definition of Done.
- Formalizzati WCAG 2.2 AA, Laws of UX, mobile-first, griglia 8pt e revisione user-centric come requisiti di progetto.

## 11.2.0 — Yuma UX/UI improvement plan

- CTA della dashboard adattiva e rimozione delle azioni duplicate.
- Copy orientato ai compiti e gerarchia più precisa di premi/orari.
- Conferma e annullamento per la registrazione delle schedine acquistate.
- Metriche di distribuzione riscritte in linguaggio non tecnico.
- Dettagli avanzati nelle impostazioni tramite progressive disclosure.
- Migliorata leggibilità dei badge mobile.
- Allineata la versione del pacchetto.

## 12.0.0 — Alvaro Hardening
- Error Boundary globale e codice diagnostico.
- Logging API strutturato con correlation ID.
- Validazione specifica di gioco, date e intervalli.
- Circuit breaker del provider.
- Seed persistito e generazioni riproducibili.
- Lazy loading delle viste principali.
- Cache PWA v12 e TTL risultati ridotto a 5 minuti.
- Header di sicurezza aggiuntivi e HSTS.
- 3 nuovi test tecnici; totale 33 test verdi.
- Documentazione tecnica Alvaro e checklist di release.
## 12.1.0 — Yuma Focused UX

- La Home non impone più automaticamente il gioco con l’estrazione più vicina.
- La prima azione è ora la scelta esplicita tra La Primitiva ed EuroDreams.
- Rimossi dalla parte alta della Home jackpot dominante, statistiche a zero, calendario aperto e stato provider invasivo.
- Statistiche e ultime giocate compaiono soltanto quando esistono dati dell’utente.
- Gli orari delle estrazioni sono disponibili tramite progressive disclosure.
- Il flusso di generazione usa un solo controllo per budget/colonne, eliminando slider, preset e input duplicati.
- Il risultato viene portato in vista automaticamente su mobile.
- Metriche, distribuzione, copia e lettura vocale sono raccolte nei dettagli facoltativi.
- Navigazione rinominata in Home e Crea giocata.
- 33 test del motore e del dominio superati.

