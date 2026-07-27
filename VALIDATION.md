# Validazione Primy v11

## Eseguito nell’ambiente di generazione

- `npm test`: **30/30 test superati**.
- calendario `Europe/Madrid` verificato in estate e dopo il cambio all’ora solare;
- distinzione EuroDreams fra chiusura, sorteggio e pubblicazione;
- Evidence Engine verificato su dati IID e bias sintetico persistente;
- generazione per entrambi i giochi e portafogli multicolonna;
- migrazione dei dati dalle versioni precedenti;
- normalizzazione delle risposte LoteriasAPI;
- parsing di **58 file JavaScript/JSX**: zero errori di sintassi;
- controllo di **109 import relativi**: zero file mancanti;
- JSON di configurazione validi.

## Non certificato nell’ambiente di generazione

`npm install --package-lock-only` non ha raggiunto il registro npm entro il timeout di rete. Di conseguenza non sono stati certificati localmente:

- build Vite di produzione;
- bundle size e warning del bundler;
- Lighthouse e Core Web Vitals;
- audit automatico WCAG;
- comportamento reale su Safari iOS/iPadOS, Chrome Android e browser desktop;
- scanner con resguardi reali;
- lifecycle del service worker dopo un deploy.

Il workflow GitHub incluso esegue installazione, test e build dopo il push. La creazione di un `package-lock.json` resta obbligatoria al primo ambiente con accesso stabile a npm.

## Collaudo consigliato dopo il deploy

1. Aprire `/api/bootstrap` e verificare entrambi i giochi.
2. Provare i deep link `/genera`, `/giocate` e `/impostazioni`.
3. Verificare indietro/avanti del browser.
4. Generare 1, 5 e 20 colonne sui due giochi.
5. Chiudere il dialogo fotocamera con X, Escape e backdrop, verificando che la camera si spenga.
6. Provare tema sistema, chiaro e scuro.
7. Simulare modalità offline.
8. Controllare aggiornamento PWA dopo un secondo deploy.
9. Eseguire Lighthouse e axe su mobile e desktop.
10. Creare il lockfile e sostituire `npm install` con `npm ci` nel workflow.
