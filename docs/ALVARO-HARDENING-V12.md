# Primy v12 — Alvaro Hardening

## Obiettivo
Trasformare Primy da PWA avanzata a base production-oriented senza riscrivere motore e UX.

## Implementato
- Error Boundary globale con codice diagnostico e recupero controllato.
- Logging JSON strutturato e `X-Request-Id` per gli endpoint principali.
- Validator specifici per gioco, anni e liste di date.
- Circuit breaker del provider per limitare raffiche di errori in istanze serverless calde.
- Header di sicurezza aggiuntivi e HSTS su Vercel.
- Cache risultati ridotta a 5 minuti e timeout network-first ridotto.
- Cache PWA versionate v12.
- Seed crittografico persistito nelle giocate e possibilità di riproduzione deterministica.
- Metadati del motore aggiornati a 12.0 con configurazione di generazione.
- Lazy loading delle viste principali e dello scanner.
- Test aggiuntivi per validazione API, circuit breaker e riproducibilità del motore.
- Workflow CI predisposto per `npm ci` quando il lockfile è presente.

## Non completato nell'ambiente di generazione
- `package-lock.json`: il registro npm non ha risposto entro il timeout.
- Test end-to-end Playwright e axe: richiedono installazione delle dipendenze e browser.
- Migrazione completa a TypeScript e IndexedDB: pianificata in modo incrementale per evitare regressioni massive.
- Provider secondario: richiede scelta contrattuale e verifica della licenza/affidabilità della fonte.

## Variabili di produzione
- `LOTERIA_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

In produzione pubblica Upstash deve essere considerato obbligatorio, non facoltativo.
