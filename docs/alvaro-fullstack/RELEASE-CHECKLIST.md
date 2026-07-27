# Release checklist

## Codice
- [ ] Test unitari verdi.
- [ ] Build Vite completata.
- [ ] Nessun import mancante.
- [ ] `package-lock.json` aggiornato e CI con `npm ci`.
- [ ] Versione package, cache PWA e changelog coerenti.

## API e sicurezza
- [ ] `LOTERIA_API_KEY` configurata.
- [ ] Upstash configurato per rate limiting distribuito.
- [ ] Test provider con fixture reali.
- [ ] Header di sicurezza verificati sul deploy.
- [ ] Nessun segreto nel bundle client.

## UX e accessibilità
- [ ] Review Yuma completata.
- [ ] Test axe senza violazioni critiche.
- [ ] Flusso principale Playwright verde.
- [ ] Verifica manuale Safari iPad/iPhone e Chrome Android.

## Produzione
- [ ] Preview deploy approvato.
- [ ] Log e correlation ID funzionanti.
- [ ] Rollback disponibile.
- [ ] Service worker aggiornato senza cache stale critica.
