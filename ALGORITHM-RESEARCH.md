# Ricerca algoritmica — Primy v11

## Concorrenti esaminati

### Lotto Craft

Dichiara AI su dati storici, scoring delle combinazioni e wheel systems abbreviati. La parte matematicamente più solida è il wheeling, perché migliora la copertura di un insieme di numeri a parità di colonne. Le dichiarazioni sul potenziale predittivo non sono accompagnate da un benchmark pubblico riproducibile.

### BeatLottery AI

Pubblica le previsioni prima delle estrazioni e dichiara l'uso di K-Nearest Neighbors sulle sequenze storiche. Questa trasparenza è positiva; lo storico pubblico mostra però soprattutto 0 o 1 corrispondenza, risultato compatibile con una baseline casuale per giochi con grandi spazi combinatori.

### Smart Luck

Combina statistiche storiche e sistemi di wheeling con garanzie condizionate: la garanzia vale soltanto se il gruppo di numeri scelto contiene un certo numero di vincenti. I filtri riducono il numero di colonne ma possono eliminare la garanzia.

### App basate su hot/cold, ritardi e LSTM

Le descrizioni pubbliche espongono frequenze, ritardi, reti LSTM o generiche “AI predictions”, ma raramente mostrano una cronologia completa pre-registrata o un confronto a pari budget con il casuale.

## Decisioni tecniche

1. **KNN incluso ma non privilegiato.** È trattato come uno dei modelli concorrenti e riceve peso solo dopo validazione.
2. **Bayes/Dirichlet incluso.** È il modo più semplice e regolarizzato per rilevare un eventuale bias persistente nelle frequenze.
3. **Recenza inclusa con shrinkage.** Può rilevare cambiamenti, ma viene scartata quando produce solo rumore.
4. **LSTM non incluso.** Con 4.167 estrazioni Primitiva e circa 284 EuroDreams, una rete profonda ha troppi gradi di libertà rispetto ai dati e un rischio elevato di overfitting.
5. **ARIMA non incluso.** Le estrazioni sono insiemi non ordinati di categorie, non una serie numerica continua adatta a quel modello.
6. **Wheel/covering design potenziato.** La ricerca locale migliora il portafoglio rispetto a una selezione greedy pura.
7. **Anti-condivisione separata.** Influenza il possibile premio condiviso, non la corrispondenza con l'estrazione.

## Validazione

Ogni modello viene valutato in walk-forward sulle estrazioni che non ha visto. Per ciascun fold:

- produce probabilità marginali per ogni numero;
- viene confrontato con il casuale uniforme usando lo stesso numero di ticket simulati;
- viene valutato sia con Brier score sia con corrispondenze medie;
- usa semi accoppiati per ridurre la varianza del confronto.

L'evidenza viene stimata con bootstrap a blocchi, per ridurre l'ottimismo dovuto alla dipendenza tra finestre sovrapposte. La soglia è corretta in modo conservativo per i quattro modelli testati.

## Regola di sicurezza

Se nessun modello supera la baseline con evidenza sufficiente:

```text
peso storico = 0%
casuale uniforme = 100%
```

Se esiste un segnale ripetuto, il peso storico complessivo resta comunque limitato al 25%. Questo impedisce a un'anomalia temporanea di dominare le colonne.

## Limite fondamentale

La v10 migliora la qualità del confronto sperimentale e l'ottimizzazione multicolonna. Non dimostra che una lotteria correttamente casuale sia prevedibile. Il vantaggio più concreto resta la costruzione di portafogli meno ridondanti.
