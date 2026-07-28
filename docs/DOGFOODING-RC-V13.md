# Primy v13 — Dogfooding Release Candidate

## Profili simulati

1. Nuovo utente: onboarding → Home → creazione → salvataggio → Archivio.
2. Utente abituale: Home → creazione rapida → registrazione del boleto → nuova giocata.
3. Utente di controllo: Home/Archivio → controllo risultati → dettaglio della giocata.
4. Utente di ritorno: accesso diretto tramite URL a Crear, Explorar, Archivo e Perfil.

## Correzioni applicate

- Allineato il testo della vista previa alla CTA reale «Crear mi jugada».
- Aggiunte CTA dirette nello stato vuoto dell'Archivio: creare una giocata o aggiungere un boleto.
- Interrotta la generazione e terminato il Web Worker quando l'utente lascia la schermata Crear.
- Conservata la navigazione a tastiera, i target touch e la modalità reduced-motion.

## Quality Gate corrente

- Motore uniforme David: invariato.
- Test Node: 41/41.
- Import locali mancanti: 0.
- Build frontend: da eseguire quando il registry npm è disponibile.

## Passaggio successivo

Release Candidate Review su copy, stati di errore, deep link, modalità offline e sincronizzazione; successivamente build Vite, test browser e pacchetto finale unico.
