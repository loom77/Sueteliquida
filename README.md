# Primy 3

PWA React/Vite per generare, registrare e verificare combinazioni EuroDreams e La Primitiva.

## Funzioni

- casuale crittografico puro e anti-pattern;
- Monte Carlo educativo in Web Worker;
- archivio storico tramite LoteriasAPI;
- analisi di frequenze, ritardi, coppie, somme, pari/dispari e ripetizioni;
- ranking storico sperimentale di migliaia di combinazioni;
- portafogli da 2 a 20 colonne con sovrapposizione ridotta;
- separazione tra bozza e giocata acquistata;
- verifica per data e saldo basato solo su premi ufficiali noti;
- cache locale dello storico e cache CDN Vercel.

## Limite matematico

Lo storico non permette di prevedere un'estrazione casuale. Il ranking ordina combinazioni secondo criteri statistici e anti-condivisione; il portafoglio ottimizza la diversità tra più colonne, ma non aumenta la probabilità della singola colonna.

## Configurazione Vercel

Impostare la variabile d'ambiente:

```text
LOTERIA_API_KEY
```

La chiave si ottiene da LoteriasAPI.

## Comandi

```bash
npm install
npm test
npm run build
```
