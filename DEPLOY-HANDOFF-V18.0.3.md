# DEPLOY HANDOFF — PRIMY v18.0.3

## Scopo
Hotfix della build Vercel fallita perché `ReleaseStamp.jsx` importava `APP_RELEASE_LABEL`, non esportato da `src/utils/release.js`.

## Correzione
`src/utils/release.js` esporta ora:

```js
export const APP_VERSION = '18.0.3';
export const APP_RELEASE_LABEL = `release v${APP_VERSION}`;
```

## Deploy
```bash
npm install
npm run release:check
```

## Nota dati
La versione dello schema economico resta `18.0.2`; questo hotfix non migra né modifica giocate, spese o premi.
