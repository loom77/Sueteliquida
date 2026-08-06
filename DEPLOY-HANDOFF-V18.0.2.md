# DEPLOY HANDOFF — PRIMY v18.0.2

## Obiettivo
Rendere riconciliabili i KPI mensili prima dello sviluppo Android.

## KPI
- **Gastado este mes**: usa `purchasedAt`/registrazione e solo giocate acquistate.
- **Premios confirmados**: usa la data del sorteggio e solo categorie con fonte `manual` o `official-verification`.
- **Resultado neto**: premi confermati meno spesa, calcolato in centesimi.

## Migrazione
La normalizzazione avviene durante `sanitizePlay`. Gli importi ereditati privi di fonte/categoria restano visibili come non confermati ma non vengono sommati. Il costo storico viene congelato in `costCents`.

## Deploy
1. Estrarre il pacchetto completo.
2. Eseguire `npm install`.
3. Eseguire `npm run release:check`.
4. Pubblicare soltanto dopo test manuale su Android 360×800, 412×915 e tablet 800×1280.

## Verifica manuale minima
- Creare una bozza: la spesa non cambia.
- Registrare un boleto: la spesa aumenta.
- Inserire un premio manuale con categoria: aumenta il premio del mese del sorteggio.
- Controllare che `1.359,59 €` non venga incluso senza fonte valida.
- Aprire Archivio e toccare ciascun KPI per vedere il dettaglio.
