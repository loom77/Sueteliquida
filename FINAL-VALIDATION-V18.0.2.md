# FINAL VALIDATION — PRIMY v18.0.2

## Risultato

**Fase 1 completata: Monthly Finance Integrity.**

## Controlli eseguiti

- `npm test`: **257 test superati, 0 falliti**.
- `npm run release:guard`: superato con **122 file sorgente** e **59 file di test**.
- `node --check`: superato per i moduli JavaScript modificati senza JSX.
- Test specifici aggiunti per:
  - spesa per data di acquisto/registrazione;
  - premio per data del sorteggio;
  - fuso orario `Europe/Madrid` al cambio mese;
  - bozze escluse dalla spesa;
  - premio ereditato di `1.359,59 €` escluso;
  - duplicati con riferimento esterno;
  - risultato netto in centesimi;
  - migrazione a `prizeStatus` e `financeSchemaVersion`.

## Build

La build Vite non è stata eseguibile in questo ambiente perché `vite` non è installato. Il tentativo di installare le dipendenze è stato bloccato dal registry interno, che restituisce `404` per `@supabase/supabase-js@2.57.4`.

Questo è un limite dell'ambiente di preparazione, non un test fallito del codice. Nel sistema di deploy occorre eseguire:

```bash
npm install
npm run release:check
```

## Comportamento contabile

- **Gastado este mes**: usa la data di acquisto o registrazione.
- **Premios confirmados**: usa la data del sorteggio.
- **Resultado neto**: premi confermati meno spesa.
- Gli importi sono calcolati e salvati in centesimi interi.
- I valori precedenti senza categoria e fonte valida diventano `unconfirmed` e non vengono sommati.
- La migrazione remota è best-effort e non può impedire il caricamento dell'Archivio.

## Verifica manuale raccomandata dopo il deploy

1. Aprire Home e verificare i tre KPI del mese corrente.
2. Aprire Archivio e toccare ogni KPI per visualizzare il dettaglio.
3. Salvare una bozza e verificare che la spesa non cambi.
4. Registrare un biglietto acquistato e verificare l'aumento della spesa.
5. Controllare un premio reale e verificare che venga attribuito al mese del sorteggio.
6. Verificare che l'importo storico `1.359,59 €` resti escluso senza fonte valida.
