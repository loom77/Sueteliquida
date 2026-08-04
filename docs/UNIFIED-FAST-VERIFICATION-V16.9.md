# Primy v16.9 — Unified Fast Verification

## Obiettivo
Unificare recupero del risultato ufficiale, classificazione della vincita, importo e aggiornamento dell'Archivio per tutti i giochi supportati.

## Famiglie
- Draw: La Primitiva, Bonoloto, Euromillones, El Gordo, EuroDreams, Lotería Nacional.
- Sports: Quiniela e adattatore Quinigol.
- Horse: Lototurf e Quíntuple Plus.

## Regola di accuratezza
La categoria può essere confermata prima dell'importo. In assenza dello scrutinio economico ufficiale, Primy mostra `Importe pendiente del escrutinio oficial` e non inventa una cifra.

## Fast layer
- `primy_verification_events`: feed ufficiale unificato.
- Trigger di mirror dalle tabelle draw/sports/horse.
- RPC `primy_fast_verification_feed`.
- Supabase Realtime per avviare la verifica client immediatamente.
- Cron serale ogni 2 minuti, notturno ogni 5 minuti, diurno ogni 15 minuti.

## Cadence dei provider
- Numeriche e Lotería Nacional: ogni esecuzione del Fast orchestrator.
- Sportive: massimo ogni 5 minuti.
- Ippiche: massimo ogni 15 minuti, compatibile con il rate limit del provider.


## Stato produzione al rilascio

La migrazione Fast è stata applicata al progetto Supabase di produzione e le Edge Functions principali sono attive. Il feed Realtime è pubblicato e l'RPC unificata è stata verificata. La sincronizzazione ippica richiede ancora il deployment del relativo endpoint Vercel incluso nel pacchetto.
