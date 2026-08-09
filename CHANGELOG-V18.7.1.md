# PRIMY Web 18.7.1

Hotfix di recupero PWA e sessione.

## Correzioni

- registrazione del service worker spostata all'avvio dell'app, prima del ripristino Supabase;
- aggiornamento PWA automatico con `skipWaiting`, `clientsClaim` e pulizia delle cache obsolete;
- timeout di otto secondi sul ripristino della sessione, con ritorno al login invece del caricamento infinito;
- messaggio visibile quando una sessione salvata non può essere recuperata;
- contratto dati Web/Android mantenuto a `18.7.0`.

## Evidenze

- release guard: verde;
- test: 307/307;
- build Vite/PWA: verde;
- verifica browser: contenuto presente, nessun overlay e nessun blocco su `Abriendo tu cuenta…`.
