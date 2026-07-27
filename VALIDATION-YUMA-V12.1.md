# Validazione Primy v12.1 — Yuma Focused UX

## Stato

Implementazione completata sul pacchetto Primy v12 Alvaro Hardening.

## Flussi modificati

- Home → selezione esplicita del gioco.
- Selezione gioco → Crea giocata con gioco corretto.
- Budget → singolo stepper colonne/costo.
- Generazione → risultato visibile e scroll automatico sui viewport inferiori a 1280 px.
- Risultato → numeri e registrazione prioritari; dettagli tecnici richiudibili.

## Verifiche automatiche

Comando eseguito:

```bash
node --test --test-reporter=spec
```

Esito: **33 test superati, 0 falliti**.

## Build frontend

Il comando `npm install` non è stato completato nell’ambiente di preparazione perché il registry npm configurato ha restituito `503 Service Temporarily Unavailable` per `@vitejs/plugin-react`. Di conseguenza il build Vite non è stato eseguito in questo ambiente.

Prima del deploy eseguire in locale o nella CI:

```bash
npm install
npm run check
```

## File principali modificati

- `src/components/DashboardView.jsx`
- `src/components/AppShell.jsx`
- `src/components/GenerateView.jsx`
- `src/components/GeneratorPanel.jsx`
- `src/components/TicketPreview.jsx`
- `src/components/GameSwitch.jsx`
- `src/components/SettingsView.jsx`
- `src/App.jsx`
