# Primy v16.9.0 — Final validation

## Codice

- Motore unificato di verifica per lotterie numeriche, Lotería Nacional, giochi sportivi e giochi ippici.
- Endpoint unico `/api/check-results` con ricerca per data o `roundId`.
- Sottoscrizione Realtime a `primy_verification_events`, con polling di sicurezza.
- Liquidazione prudente: una categoria può risultare confermata senza mostrare un importo non ancora pubblicato nello scrutinio ufficiale.
- Correzione consolidata del mapping delle categorie e degli importi ufficiali.

## Test automatici

- 196 test eseguiti.
- 196 test superati.
- 0 test falliti.
- Controlli sintattici superati sui moduli JavaScript modificati.
- La build Vite completa non è stata eseguita perché le dipendenze npm non sono disponibili nell'ambiente di validazione.

## Supabase produzione

Migrazioni applicate al progetto `vmzkhelxehgedorsvchl`:

- `unified_fast_verification_v169`
- `harden_unified_verification_functions_v169`

Elementi verificati:

- tabelle sportive e ippiche create;
- tabella unificata `primy_verification_events` creata e popolata;
- trigger di mirror attivi;
- RPC `primy_fast_verification_feed` funzionante;
- `primy_verification_events` pubblicata su Supabase Realtime;
- funzioni trigger `SECURITY DEFINER` revocate a `anon` e `authenticated`;
- cron Fast attivi ogni 2 minuti in fascia di picco, ogni 5 minuti nella fascia notturna e ogni 15 minuti durante il giorno.

Edge Functions in produzione:

- `scheduled-sync-all-results` v3;
- `sync-sports-rounds` v2;
- `sync-loteria-nacional` v2.

La validazione live ha confermato il recupero e il salvataggio di:

- La Primitiva;
- EuroDreams;
- Euromillones;
- Lotería Nacional;
- Quiniela con 15 partite;
- Quinigol con 6 partite.

Bonoloto ed El Gordo usano lo stesso canale numerico e vengono registrati quando SELAE pubblica un'estrazione compatibile.

## Limitazione di deployment

L'architettura database e il motore ippico sono inclusi e pronti. La sincronizzazione automatica di Lototurf e Quíntuple Plus resta inattiva in produzione finché questo pacchetto non viene distribuito su Vercel: l'attuale deployment non espone ancora `/api/sync-horse-rounds` e risponde con HTTP 404.

Anche il frontend di `sueteliquida.vercel.app` deve essere aggiornato con questa release per utilizzare il feed unificato, il Realtime e la nuova liquidazione.
