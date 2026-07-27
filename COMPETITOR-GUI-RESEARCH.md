# Primy v11 — Benchmark competitivo GUI/UX

Ricerca svolta il 26 luglio 2026 su store e pagine ufficiali. La valutazione riguarda l’esperienza, non la capacità di prevedere un’estrazione.

## Benchmark selezionati

### TuLotero
- 4,7/5 con circa 182.000 valutazioni su App Store Spagna.
- Home orientata ai giochi: il bote, la data e il pulsante di azione sono immediatamente visibili.
- Punti forti: ciclo completo, navigazione inferiore, scanner, notifiche e biglietti conservati.
- Debolezze: elevata densità promozionale, molti giochi e azioni concorrenti, interfaccia visivamente rumorosa.

### ScanLotería
- 4,7/5 con circa 3.900 valutazioni su App Store Spagna.
- Proposta molto semplice: registra o scansiona il boleto e lascia che l’app controlli il risultato.
- Punti forti: promessa chiara, poco lavoro manuale, notifiche automatiche.
- Debolezze: il valore è concentrato nello scanner e nell’acquisto, non nella costruzione coordinata delle colonne.

### LoteríasPRO di SELAE
- Oltre 1 milione di download su Google Play.
- Usa un hub di attività e un percorso guidato per creare il boleto digitale.
- Punti forti: autorevolezza, scelta dei giochi, boleto ripetibile e QR per il punto vendita.
- Debolezze: home a icone esagonali poco moderna, selezione numerica molto densa e separazione debole tra creazione, archivio e risultati.

### Lotto Craft AI & Statistics
- 4,1/5 con circa 184 recensioni su Google Play.
- Usa un percorso sequenziale: seleziona numeri, applica wheel system, scegli i ticket.
- Punti forti: analisi, copertura e strumenti avanzati.
- Debolezze: numeri piccoli, schermate dense, curva di apprendimento elevata e punteggi facilmente interpretabili come previsione.

## Confronto con Primy v9

| Area | Migliori concorrenti | Primy v9 | Decisione v9 |
|---|---|---|---|
| Prossima estrazione | Bote e CTA in home | Data chiara, bote assente | Bote da API, sincronizzazione e CTA nello stesso hero |
| Azioni principali | Scanner, gioca, risultati | Distribuite nelle viste | Tre azioni rapide sulla dashboard |
| Generazione | Spesso molto tecnica o commerciale | Semplice ma solo per colonne | Colonne e budget sincronizzati |
| Schedine esterne | Scanner centrale | Assente | Inserimento manuale + lettore codice beta con conferma |
| Riutilizzo | Preferiti, rinnovo, ripeti | Assente | Preferiti, ripeti numeri e crea variante |
| Comprensione copertura | Grafici complessi | Metriche testuali | Mappa 1–49/1–40 leggibile e non predittiva |
| Tema scuro | Richiesto nelle recensioni | Assente | Sistema, chiaro e scuro |
| Installazione | App native | PWA non guidata | Prompt installazione e istruzioni iOS |
| Affidabilità | Notifiche e cache | Cache storico | Runtime cache PWA e dati aggiornati con fallback |
| Privacy | Spesso account e dati finanziari | Locale | Mantiene dati locali e nessun account obbligatorio |

## Principi GUI applicati

1. **Outcome-first:** la prima schermata mostra estrazione, bote e azione utile.
2. **Tre azioni massimo:** genera, aggiungi schedina, controlla risultati.
3. **Progressive disclosure:** dettagli statistici e storico sono secondari.
4. **Nessun punteggio predittivo:** la distribuzione è visualizzata senza “qualità” o probabilità.
5. **Una CTA dominante per contesto:** generare, salvare o verificare, mai tutte insieme.
6. **Densità controllata:** numeri grandi, touch target ≥44 px e spaziatura stabile.
7. **Feedback affidabile:** ultima sincronizzazione, errori contestuali e cache offline.
8. **Privacy-by-default:** nessuna registrazione e backup controllato dall’utente.

## Fonti

- TuLotero App Store: https://apps.apple.com/es/app/tulotero-compra-loter%C3%ADa-online/id948041023
- TuLotero: https://tulotero.es/
- ScanLotería App Store: https://apps.apple.com/es/app/scanloter%C3%ADa-esc%C3%A1ner-loter%C3%ADa/id688855874
- LoteríasPRO Google Play: https://play.google.com/store/apps/details?id=com.selae.eLoterias.presencial
- Lotto Craft Google Play: https://play.google.com/store/apps/details?id=com.bluedust.lottocraft
