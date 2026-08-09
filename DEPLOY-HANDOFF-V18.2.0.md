# Deploy handoff — PRIMY v18.2.0

1. Caricare il contenuto del pacchetto completo nella root del repository GitHub.
2. Verificare che `src/styles/android-design-system.css` sia presente.
3. Verificare che `src/main.jsx` importi il file dopo `primy-v18.css`.
4. Verificare che `/public/mascot/primy-official-v18.png` sia presente.
5. Eseguire:

```bash
npm install
npm run release:check
```

6. Avviare il deploy Vercel.
7. Controllare su viewport 360×800, 412×915, 600×960, 800×1280 e desktop.
8. Controllare tema chiaro/scuro, font al 200% e navigazione gestuale Android.

## Smoke test

- Inicio mostra il nuovo gufo.
- I tre KPI mensili aprono Archivo.
- Preparar mostra Juego → Configura → Crea → Guarda.
- La barra inferiore contiene quattro destinazioni.
- Nessuna CTA è coperta dalla barra inferiore.
- Release visibile: `release v18.2.0`.
