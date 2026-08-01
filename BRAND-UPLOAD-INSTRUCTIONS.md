# Caricamento su GitHub

## Metodo consigliato

Carica il contenuto di questo archivio **sopra** il repository esistente, scegliendo la sostituzione dei file omonimi. Non cancellare preventivamente i file già presenti nel repository.

Il refresh del marchio è isolato negli asset `public/` e nel foglio `src/brand-refresh.css`; in questo modo aggiorna anche il vecchio simbolo inline senza sostituire il componente completo `BrandVisuals.jsx`.

Dopo il caricamento:

```bash
npm install
npm run check
```

Controlla quindi header mobile, sidebar desktop, accesso, favicon e installazione PWA.
