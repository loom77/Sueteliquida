# PRIMY Web v18.7.1 — PWA Recovery Hotfix

- Aggiornamento PWA automatico prima dell'autenticazione.
- Attivazione immediata del nuovo service worker e pulizia delle cache obsolete.
- Timeout sicuro del ripristino Supabase per evitare `Abriendo tu cuenta…` infinito.
- Contratto dati Web/Android invariato a `18.7.0`.

---

# PRIMY Web v18.4.5 — Android Bonoloto Bridge

- Release bumped to 18.4.5.
- Web registration remains disabled; existing test login remains available.
- Added Web/Android contract regression coverage for Bonoloto alpha5.
- Web accepts Android Bonoloto drafts with `receiptExtra: null` without inventing a reintegro.
- Web rejects a Bonoloto play marked as purchased if the real receipt reintegro is missing.
- Exact-date verification lock is explicitly covered for Bonoloto as well as La Primitiva.
- Data contract remains `18.4.0`; no incompatible schema migration is introduced.

---

# PRIMY v18.4.1 — Unsaved Generation Guard

## Nuovo comportamento
Quando esiste una giocata appena generata con `saveState === 'unsaved'`, PRIMY impedisce di perderla per errore senza una conferma esplicita.

Il guard copre:
- navigazione verso Inicio / Archivo / Perfil / Juegos;
- tasto Indietro del browser nella SPA;
- cambio gioco;
- `Modificar configuración` / scarto del risultato;
- chiusura sessione;
- refresh o chiusura della scheda tramite `beforeunload` nativo del browser.

Dialogo Primy:
- `Seguir revisando`
- `Salir y perder los números`

Dopo `Guardar borrador` o `Registrar como jugada`, il guard si disattiva perché la giocata è persistita.

## Compatibilità
La selezione estrazione e il contratto dati v18.4.0 restano invariati.
