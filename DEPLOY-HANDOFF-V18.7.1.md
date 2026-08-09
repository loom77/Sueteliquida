# Deploy handoff — PRIMY Web 18.7.1

Repository: `loom77/Sueteliquida`

1. Caricare il contenuto del pacchetto alla radice del repository.
2. Verificare che `package.json` mostri `18.7.1`.
3. Conservare `.github/workflows/web-ci.yml` e `package-lock.json`.
4. Attendere CI e deployment Vercel verdi.
5. Chiudere tutte le vecchie schede PRIMY e riaprire `https://sueteliquida.vercel.app/` una volta, per liberare il service worker precedente.
6. Confermare che il footer mostri `release v18.7.1` e che la pagina non resti su `Abriendo tu cuenta…`.

Non cambiare `PLAY_DATA_CONTRACT_VERSION` o `MOBILE_PLAY_DATA_CONTRACT_VERSION`: devono restare `18.7.0` per la compatibilità con Android 19.3.0-beta3.
