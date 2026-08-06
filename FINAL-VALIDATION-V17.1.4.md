# Primy v17.1.4 — Validazione finale

## Base
Release completa v17.1.1, non il pacchetto parziale presente successivamente su `main`.

## Migliorie integrate
- Hotfix mobile Yuma: gufo e icone visibili, spazi di sicurezza sopra la navigazione fissa.
- Accesso a Primy Core sempre disponibile nel generatore mobile.
- Primy Core molto evidente nella home.
- Descrizione esplicita di intelligenza artificiale, statistica e simulazioni Monte Carlo.
- Elenco completo di tutte le giocate pendenti recenti, senza limite a una sola.
- Release guard contro perdita di sorgenti e cancellazioni massive.

## Controlli eseguiti
- 120 file in `src`.
- 56 file di test.
- 239 test superati, 0 falliti (`TERM=xterm npm test`).
- Audit degli import relativi superato.
- File critici verificati mediante `npm run release:guard`.

## Build locale
La build non è stata eseguita nel container di preparazione perché il registry interno non contiene `@supabase/supabase-js@2.57.4`. Il codice conserva le dipendenze originali e Vercel/npm pubblico potrà installarle normalmente. La release non viene dichiarata build-validata localmente.
