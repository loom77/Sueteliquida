# Deploy handoff — Primy v18.0.0

## Contenuto della release

- Nuova Home Android-first conforme alla direzione visuale approvata.
- Primy Core in alta evidenza con IA, statistica, Monte Carlo e validazione delle regole.
- Percorso introduttivo in quattro passaggi e accesso diretto ai giochi principali.
- Correzione strutturale della schermata `Preparar`: accesso Core nel flusso, una sola CTA sticky e nessuna sovrapposizione con la bottom navigation.
- Responsive dedicato a smartphone e tablet Android, landscape, viewport corte e tastiera virtuale.

## File principali modificati

- `src/components/HomeExperience.jsx`
- `src/components/DashboardView.jsx`
- `src/components/GeneratorPanel.jsx`
- `src/main.jsx`
- `src/primy-v18.css`
- `src/utils/release.js`
- `package.json`
- `public/offline.html`
- `CHANGELOG.md`
- test di regressione e test release aggiornati

## Controlli eseguiti

- `npm test`: 244 test superati.
- `npm run release:guard`: superato.
- Parsing JSX con TypeScript: superato.
- Parsing CSS con PostCSS: superato.

## Build

La build Vite deve essere eseguita nell'ambiente di deploy o in una macchina con dipendenze npm disponibili:

```bash
npm install
npm run build
```

L'ambiente di preparazione non ha potuto installare `@supabase/supabase-js` dal registry interno, quindi non è stato possibile eseguire localmente la build Vite completa.
