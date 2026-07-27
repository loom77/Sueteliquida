# Primy v12.1 — Focused UX Edition

Primy è una PWA privata per creare portafogli coordinati di giocate per **La Primitiva** ed **EuroDreams**, registrare schedine acquistate tramite canali autorizzati e controllare i risultati.

La v12.1 mantiene il **Primy Evidence Engine** e l’hardening tecnico della v12, ma ricostruisce il flusso principale attorno a una sola domanda: quale gioco vuoi creare?

## Miglioramenti principali

### Esperienza utente

- routing reale con URL `/`, `/genera`, `/giocate` e `/impostazioni`;
- pulsanti avanti/indietro del browser funzionanti;
- onboarding accessibile al primo utilizzo e riapribile dalle impostazioni;
- dashboard con una sola azione primaria e separazione esplicita fra chiusura vendite, estrazione e pubblicazione del risultato;
- tabella desktop e card mobile per lo storico;
- dialoghi con focus trap, Escape, ripristino del focus e blocco dello scroll;
- lettura vocale delle colonne generate;
- dark mode basata su token semantici, non su override fragili;
- banner offline e aggiornamento PWA controllato dall’utente.

### Affidabilità tecnica

- tutti gli orari sono calcolati in `Europe/Madrid`, inclusi i cambi fra ora solare e legale;
- EuroDreams distingue chiusura alle 20:30, sorteggio alle 21:00 e risultato programmato alle 21:40;
- la fotocamera viene arrestata quando si chiude il dialogo o si cambia schermata;
- un solo endpoint `/api/bootstrap` sostituisce le richieste duplicate iniziali;
- lo storico non viene scaricato dalla dashboard e viene caricato soltanto quando serve;
- richieste client cancellabili tramite `AbortController`;
- Worker persistente fra più generazioni, così la cache del modello non viene distrutta ogni volta;
- rate limiting distribuito opzionale tramite Upstash REST, con fallback locale;
- endpoint pubblici senza dettagli interni del provider;
- storage aggiornato a `primy_plays_v11`, con migrazione automatica delle versioni precedenti;
- campo `purchasedAt` usato per attribuire correttamente la spesa mensile.

### PWA

- installabile;
- cache controllata di dashboard, storico e risultati;
- navigazione SPA compatibile con Vercel;
- avviso quando è disponibile una nuova versione;
- modalità offline esplicita per generazione e dati locali.

## Variabili Vercel

Obbligatoria:

```text
LOTERIA_API_KEY
```

Facoltative, consigliate per un servizio pubblico con più utenti:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Senza Upstash Primy continua a funzionare, ma il rate limiter serverless usa un fallback in memoria meno robusto.

## Comandi

```bash
npm install
npm test
npm run build
```

## Endpoint principali

```text
/api/bootstrap
/api/history?game=primitiva&years=10
/api/check-results?game=primitiva&dates=2026-07-27
```

## Limiti dichiarati

- Primy non vende né acquista schedine.
- Il lettore beta acquisisce il codice del resguardo come riferimento; i numeri devono essere confermati manualmente perché i formati SELAE non sono documentati pubblicamente.
- Le notifiche locali funzionano quando l’app è attiva. Le push in background richiederebbero un servizio push e un backend dedicato.
- Il modello non garantisce vincite e torna al casuale uniforme quando non trova evidenza storica sufficiente.

## Privacy

Giocate e preferenze restano nel browser. La chiave del provider è utilizzata esclusivamente dalle funzioni serverless Vercel.

## Yuma UX/UI

Il repository include il ruolo ufficiale di revisione UX/UI in `docs/yuma-ux-ui/`. Le decisioni di interfaccia devono essere valutate secondo persona, user flow, architettura informativa, griglia 8pt, mobile-first, WCAG 2.2 AA e principi di psicologia del design.

## Primy v12 — Alvaro Hardening
Questa versione applica il primo ciclo di hardening tecnico guidato da Alvaro: Error Boundary, osservabilità, validazione API, circuit breaker, seed riproducibile, lazy loading e cache risultati più conservativa.

Consulta:
- `docs/ALVARO-HARDENING-V12.md`
- `docs/alvaro-fullstack/ROLE.md`
- `docs/alvaro-fullstack/RELEASE-CHECKLIST.md`
- `VALIDATION-ALVARO-V12.md`

Per un deploy pubblico configura anche Upstash oltre a `LOTERIA_API_KEY`.
## Primy v12.1 — Yuma Focused UX

La Home apre con una scelta esplicita tra **La Primitiva** ed **EuroDreams**; il gioco con l’estrazione più vicina non viene più imposto come contenuto principale. Il flusso operativo è ora:

```text
Scegli gioco → imposta budget → genera → controlla i numeri → registra o salva
```

Le informazioni secondarie sono nascoste finché non servono: il calendario è richiudibile, le statistiche non compaiono a zero e i dettagli tecnici della generazione sono facoltativi.

