# Caricamento da iPad su GitHub

Lo ZIP contiene direttamente i file della radice del repository.

1. Nell’app File, tocca lo ZIP per estrarlo.
2. Apri la cartella estratta.
3. Su GitHub apri il repository e scegli **Add file → Upload files**.
4. Carica il contenuto a gruppi: prima i file della radice, poi `api`, `public`, `src` e `tests`.
5. I file con lo stesso percorso sostituiscono quelli vecchi.
6. Verifica che nella radice compaiano direttamente `api`, `public`, `src`, `tests`, `package.json` e `vite.config.js`.
7. Esegui il commit. Vercel avvierà automaticamente il deploy.

Non caricare una cartella esterna chiamata `primy-v2` o `primy-main` dentro il repository.
