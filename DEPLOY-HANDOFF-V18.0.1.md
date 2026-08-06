# Deploy handoff — Primy v18.0.1

## Obiettivo
Correggere il totale premi dell’Archivio, evitando che importi non confermati o categorie abbinate in modo ambiguo vengano mostrati come vincite reali.

## File principali modificati
- `src/utils/playModel.js`
- `src/utils/payout.js`
- `src/verification/verificationEngine.js`
- `src/hooks/useStorage.js`
- `src/components/TicketHistory.jsx`
- `tests/prizeIntegrityV18_0_1.test.js`
- `package.json`
- `src/utils/release.js`

## Comportamento dopo il deploy
- I dati storici con importi ma senza fonte esplicita non entrano nel totale.
- Le nuove verifiche ufficiali salvano `prizeSource: official-verification`.
- Gli importi inseriti manualmente salvano `prizeSource: manual`.
- Le categorie numerate non possono più collidere per corrispondenze parziali.

## Deploy manuale
1. Caricare il contenuto del pacchetto sul branch di destinazione.
2. Eseguire `npm install`.
3. Eseguire `npm test`.
4. Eseguire `npm run build`.
5. Pubblicare su Vercel e forzare l’aggiornamento della PWA.
