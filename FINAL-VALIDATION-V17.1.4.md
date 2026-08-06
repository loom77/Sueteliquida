# Primy 17.1.4 — Yuma Mobile + Pending Plays

## Correzioni incluse

- gufo ripristinato nella home mobile;
- icone della navigazione e dei giochi rese nuovamente visibili;
- accesso “Descubre cómo funciona Primy Core” mantenuto sopra i controlli fissi;
- nuova sezione “Jugadas pendientes recientes” nell’archivio;
- tutte le giocate con stato `scheduled` o `awaiting_check` sono elencate, senza `slice` o limite a una sola scheda;
- ordine dalla più recente alla meno recente;
- azione “Comprobar ahora” disponibile per ogni giocata verificabile;
- lista mobile senza altezza massima né clipping.

## Validazione locale

- test statico/regressione 17.1.4: previsto in `tests/yumaMobilePendingPlaysV17_1_4.test.js`;
- versione applicazione e package allineata a 17.1.4;
- stylesheet caricato dopo `index.css` per prevalere sulle regole Yuma precedenti.

## Stato repository

Base: `loom77/Sueteliquida`, branch `main`, commit `1d38a42190c2c38554b4867ec6375e85ce846f7d`.
Il connettore GitHub ha restituito 403 sulle operazioni di scrittura, quindi questa release non è dichiarata pubblicata nel repository.
