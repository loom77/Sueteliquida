# Primy v12.1 — Implementazione Yuma Focused UX

## Obiettivo

Ridurre il carico cognitivo del flusso principale e impedire che Primy scelga implicitamente un gioco in base alla prossima estrazione.

## Nuovo flusso

1. La Home chiede **“Cosa vuoi giocare?”**.
2. L’utente seleziona La Primitiva oppure EuroDreams.
3. La schermata di creazione mostra un solo controllo per il budget, espresso anche come numero di colonne.
4. Dopo la generazione, il risultato viene portato in vista automaticamente.
5. L’utente registra la schedina acquistata oppure la salva come bozza.
6. Metriche, mappa di distribuzione, copia e lettura vocale restano disponibili in una sezione facoltativa chiusa.

## Modifiche alla Home

- Rimosso il banner dominante della prossima estrazione.
- Nessun gioco viene presentato come scelta predefinita.
- Le due card di gioco hanno pari peso visivo.
- La Primitiva ed EuroDreams sono ordinate stabilmente, non in base all’orario dell’estrazione.
- Le statistiche sono mostrate solo quando esistono giocate.
- In assenza di storico viene proposta soltanto l’azione secondaria “Aggiungi schedina”.
- Il calendario completo è racchiuso in un elemento `details`.
- Lo stato della fonte dati è ridotto a un indicatore nel footer.

## Modifiche alla generazione

- Eliminati slider, preset e input budget simultanei.
- Un unico stepper modifica colonne e budget in modo coerente.
- La CTA include quantità e costo totale.
- L’anteprima vuota non occupa spazio prima della generazione.
- Il risultato generato riceve uno scroll automatico, particolarmente utile su mobile.

## Modifiche al risultato

- Numeri e azioni di registrazione restano sempre visibili.
- Metriche, distribuzione, strumenti copia/ascolto e spiegazione del metodo sono chiusi in “Strumenti e dettagli tecnici”.
- Corretto il riferimento al range numerico usando `numberPoolMax`.
- Le azioni secondarie “Genera di nuovo” e “Scarta” sono de-enfatizzate.

## Accessibilità

- Controlli con target minimo di 44–48 px.
- `aria-label` espliciti per la modifica del budget.
- `aria-live` per quantità e risultato.
- Focus visibile mantenuto tramite i token globali.
- Progressive disclosure nativa tramite `details/summary`.
- Rispetto di `prefers-reduced-motion` già presente nel progetto.

## Verifica eseguita

- 33 test automatici del dominio e del motore: superati.
- Revisione statica dei flussi Home → Crea giocata → Risultato.
- Il build Vite richiede l’installazione delle dipendenze npm; nell’ambiente di preparazione il registry ha restituito HTTP 503, quindi il comando di build deve essere rieseguito in locale o in CI.
