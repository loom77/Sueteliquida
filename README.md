# Primy

PWA React/Vite per generare e registrare combinazioni EuroDreams e La Primitiva.

## Funzioni
- casuale crittografico puro, anti-pattern e modalità Monte Carlo educativa;
- anteprima separata dalla conferma di acquisto;
- storico locale versionato;
- verifica per data tramite storico LoteriasAPI;
- categorie corrette, inclusa Especial della Primitiva;
- saldo basato solo su premi ufficiali noti;
- Monte Carlo in Web Worker.

## Avvio
```bash
npm install
npm run dev
```

## Vercel
Impostare `LOTERIA_API_KEY` in Project Settings → Environment Variables. La chiave non deve essere esposta nel frontend.

## Build e test
```bash
npm test
npm run build
```
