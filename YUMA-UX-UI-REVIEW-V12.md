# Yuma UX/UI — Revisione Primy v12

**Ruolo:** Lead Product Designer / UX/UI reviewer  
**Oggetto:** `primy-v12-alvaro-hardening-final(2).zip`  
**Verdetto:** la base tecnica è ordinata e l’accessibilità è sopra la media, ma l’interfaccia è sovraccarica, ripetitiva e priva di una gerarchia operativa netta. L’utente deve leggere troppo prima di capire quale azione compiere.

## Valutazione sintetica

| Area | Voto | Osservazione |
|---|---:|---|
| Chiarezza immediata | 4/10 | Troppe informazioni e CTA allo stesso livello. |
| Gerarchia visiva | 3/10 | Quasi tutto è presentato come card importante. |
| Facilità del flusso principale | 5/10 | Il flusso esiste, ma è diluito da controlli e spiegazioni. |
| Coerenza terminologica | 5/10 | “Giocata”, “schedina”, “portafoglio”, “colonne” e linguaggio tecnico convivono senza una regola chiara. |
| Mobile | 5/10 | Navigazione adeguata, ma pagine molto lunghe e risultato generato poco visibile. |
| Accessibilità | 8/10 | Focus, target touch, dialoghi e reduced motion sono ben gestiti. |
| Qualità complessiva UX/UI | **5/10** | Funzionale, ma non semplice. |

# Diagnosi principale

Primy sta cercando di dimostrare contemporaneamente affidabilità, trasparenza tecnica, controllo della spesa, stato dei provider, calendario, statistiche e potenza del motore. Il risultato è una **card soup**: molte card, titoli, badge, descrizioni, colori e pulsanti con peso visivo simile.

La regola corretta deve diventare:

> In ogni schermata una sola domanda, una sola azione primaria e non più di due azioni secondarie visibili.

# Problemi bloccanti — Priorità P0

## 1. La Dashboard contiene almeno cinque dashboard diverse

Attualmente mostra:

- prossima estrazione;
- “prossima azione” duplicata;
- quattro statistiche mensili/totali;
- calendario dettagliato di tutti i giochi;
- ultime giocate;
- stato sincronizzazione, provider e installazione.

L’utente ha invece due soli bisogni immediati:

1. creare una giocata;
2. controllare una giocata esistente.

### Correzione

La Home deve contenere solo:

- **card principale della prossima estrazione** con una CTA;
- **alert “X giocate da controllare”**, soltanto quando necessario;
- **riepilogo compatto del mese** su una riga;
- **ultime 2 giocate**, dentro una sezione richiudibile.

Il calendario completo va spostato in una schermata secondaria o in un dettaglio apribile.

## 2. La pagina Genera offre troppe modalità per lo stesso input

Il numero di colonne viene controllato contemporaneamente tramite:

- pulsanti meno/più;
- slider;
- cinque preset;
- input budget;
- riepilogo costo.

Sono quattro interfacce per una sola decisione. È il punto che produce maggiormente la sensazione di “200 cose”.

### Correzione

Scegliere **un solo modello principale**:

- selezione gioco;
- scelta del budget tramite 4 preset chiari;
- voce “Personalizza” per un importo libero;
- CTA fissa “Genera X colonne — €Y”.

Il numero di colonne può essere mostrato come risultato del budget, non come secondo sistema concorrente.

## 3. Il risultato generato sembra un report tecnico

La preview include:

- numeri;
- ascolto;
- copia;
- espansione colonne;
- tre metriche tecniche;
- spiegazione del metodo;
- disclaimer;
- conferma acquisto;
- salvataggio bozza;
- nuova generazione;
- scarto;
- mappa di distribuzione.

Il compito principale è leggere e usare i numeri. Tutto il resto deve essere subordinato.

### Correzione

Dopo la generazione mostrare:

- gioco, estrazione, costo;
- colonne generate;
- CTA primaria **“Registra come giocata”**;
- CTA secondaria **“Genera di nuovo”**;
- menu “Altre opzioni” per bozza, copia, ascolto e scarto;
- sezione chiusa “Dettagli del metodo” con metriche e distribuzione.

La mappa e “combinazioni valutate” non devono essere visibili nel percorso standard.

## 4. Il risultato mobile può comparire fuori dallo schermo

Su mobile il pannello di generazione viene prima della preview. Dopo il click il risultato appare sotto un form molto alto, senza un passaggio esplicito o uno scroll/focus verso il risultato.

### Correzione

Dopo la generazione:

- passare automaticamente allo stato “Risultato”; oppure
- eseguire focus e scroll accessibile verso il titolo “Giocata pronta”; oppure
- sostituire il form con la schedina e offrire “Modifica impostazioni”.

La soluzione migliore è un flusso a due stati: **Configura → Risultato**.

# Revisione per schermata

## Home

### Criticità

- Hero e card “Prossima azione” comunicano spesso lo stesso messaggio.
- Le quattro metriche hanno lo stesso peso della CTA principale.
- Il calendario espone orari tecnici non necessari ogni volta.
- “Ultima sincronizzazione” e stato provider sono informazioni di sistema, non contenuto primario.

### Nuova struttura

1. Saluto/titolo breve: “Cosa vuoi fare?”
2. Card prossima estrazione.
3. CTA “Genera giocata”.
4. Alert condizionale per controlli disponibili.
5. “Questo mese: spesi €X · vinti €Y”.
6. Ultime giocate richiudibili.

## Genera

### Criticità

- Titolo lungo e autocelebrativo.
- “Portafoglio”, “coordinamento”, “ripetizione inutile” sono termini poco immediati.
- Troppi controlli equivalenti.
- Il box scuro ripete quantità, costo e CTA già presenti.

### Nuova struttura

- Titolo: **“Genera una giocata”**.
- Step 1: gioco.
- Step 2: budget.
- Riepilogo in linea: “5 colonne · €5,00”.
- Un solo pulsante: “Genera”.
- Opzioni avanzate solo su richiesta.

## Giocata pronta

### Criticità

- Metriche tecniche vengono presentate come risultati importanti.
- “Media tecnica” e “combinazioni valutate” non aiutano una decisione.
- Sei azioni visibili competono tra loro.
- “Ho giocato questa schedina” è corretto ma eccessivamente lungo come CTA.

### Nuova struttura

- CTA primaria: **“Registra giocata”**.
- Sotto: “Usala dopo aver acquistato la schedina”.
- CTA secondaria: “Genera di nuovo”.
- Link: “Salva come bozza”.
- Menu: Copia, Ascolta, Elimina.
- Dettagli tecnici chiusi per default.

## Le mie giocate

### Criticità

- Ricerca, gioco, stato e ordine sono sempre visibili anche con poche giocate.
- Ogni dettaglio espone Preferito, Ripeti, Variante, Acquistata ed Elimina.
- Le azioni secondarie dominano la lettura dello stato.

### Nuova struttura

Usare tre tab:

- **Attive**
- **Da controllare**
- **Archivio**

Mostrare il bottone “Filtri” soltanto quando serve. Ogni card deve avere:

- gioco/data;
- stato;
- costo/premio;
- una CTA contestuale;
- menu a tre punti per Preferito, Ripeti, Variante ed Elimina.

## Impostazioni

### Criticità

- “Fonte dati” è la prima sezione, ma interessa principalmente manutenzione e debug.
- La pagina presenta troppe sezioni separate.
- Aspetto, notifiche, installazione, limite, dati storici, backup e cancellazione hanno lo stesso peso.
- Testo “storico, boti e verifica” contiene un termine poco chiaro/possibile refuso.

### Nuova struttura

**Preferenze**
- tema;
- notifiche;
- limite mensile.

**App e dati**
- installazione;
- backup;
- elimina dati.

**Avanzate** — chiusa
- stato fonte dati;
- storico;
- metodo Primy;
- diagnostica.

## Onboarding

### Criticità

- Quattro passaggi prima di usare l’app.
- Il primo messaggio spiega cosa Primy non è, invece di far completare il primo task.
- La chiusura equivale al completamento senza una chiara azione “Salta”.

### Correzione

Una sola schermata:

> Scegli il gioco, genera le colonne e registra soltanto quelle che acquisti. I dati restano sul dispositivo.

Pulsanti:

- “Crea la prima giocata”
- “Esplora l’app”

# Nuova architettura informativa

## Navigazione primaria

1. **Home**
2. **Genera** — azione centrale/evidenziata
3. **Giocate**
4. **Altro** o **Impostazioni**

La navigazione attuale a quattro voci può essere mantenuta, ma “Dashboard” deve diventare “Home” e “Le mie giocate” deve diventare “Giocate” su mobile.

# Wireframe testuale

## Home mobile

```text
[Primy]                         [stato]

Prossima estrazione
La Primitiva
Giovedì · 21:40
Bote €XX M

[ Genera una giocata ]

! 2 giocate pronte da controllare
[ Controlla ora ]

Questo mese
Spesi €12,00     Premi €0,00

Ultime giocate                         >

[Home] [Genera] [Giocate] [Altro]
```

## Genera mobile

```text
Genera una giocata

Gioco
[ La Primitiva ] [ EuroDreams ]

Quanto vuoi spendere?
[ €1 ] [ €3 ] [ €5 ] [ €10 ]
[ Personalizza ]

Otterrai 5 colonne

[ Genera 5 colonne · €5,00 ]
```

## Risultato mobile

```text
Giocata pronta
La Primitiva · Giovedì
5 colonne · €5,00

1   [02] [11] [18] [26] [38] [47]  R: 6
2   [04] [09] [21] [31] [42] [48]  R: 2
...

[ Registra giocata ]
[ Genera di nuovo ]
Salva come bozza       Altre opzioni ···

> Dettagli del metodo
```

# Regole del nuovo design system

- Una sola card dominante per viewport.
- Massimo due livelli di card; evitare card dentro card salvo dialoghi.
- Massimo una CTA piena per sezione.
- Colore indigo per azioni principali; verde solo per successo/verifica; ambra solo per attenzione.
- Ridurre l’uso di `font-black`: titoli principali e valori, non ogni label e pulsante.
- Ridurre i raggi: `rounded-xl` come standard; `rounded-2xl` solo per card principali; evitare `rounded-3xl` ripetuto.
- Testo di supporto non oltre due righe nel flusso principale.
- Informazioni tecniche sempre sotto progressive disclosure.
- Usare terminologia stabile:
  - “Giocata” = insieme di colonne;
  - “Colonna” = combinazione;
  - “Schedina acquistata” solo quando è stata realmente comprata;
  - evitare “portafoglio” nell’interfaccia principale.

# Accessibilità — interventi consigliati

La base è buona. Restano da migliorare:

- spostare focus/scroll sul risultato dopo la generazione;
- evitare `aria-live` su un’intera sezione molto lunga;
- verificare contrasto dei colori fissi in dark mode;
- rendere esplicita l’azione “Salta introduzione”;
- mantenere target touch da almeno 44×44 px;
- testare con VoiceOver su iPhone/iPad e tastiera desktop.

# Piano di intervento

## P0 — Semplificazione strutturale

1. Ridurre Home a quattro moduli.
2. Trasformare Genera in un flusso Configura → Risultato.
3. Rimuovere slider, stepper e preset concorrenti; mantenere il budget come input principale.
4. Spostare metriche e mappa in “Dettagli del metodo”.
5. Ridurre le azioni visibili della giocata pronta a tre.

## P1 — Pulizia dei flussi secondari

1. Tab Attive / Da controllare / Archivio.
2. Filtri dietro un pulsante.
3. Menu overflow per azioni secondarie.
4. Riordinare e raggruppare Impostazioni.
5. Sostituire onboarding a quattro step con una schermata.

## P2 — Rifinitura visuale

1. Ridurre card, bordi, raggi e testi bold.
2. Uniformare spaziatura su griglia 8 pt.
3. Definire componenti Button, Card, Alert e SectionHeader coerenti.
4. Verificare dark mode e viewport 320, 375, 768, 1024 e 1440 px.

# Criteri di accettazione

La revisione è riuscita quando:

- un nuovo utente identifica “Genera” in meno di 3 secondi;
- una giocata viene generata con massimo 3 decisioni;
- dopo la generazione i numeri sono immediatamente visibili;
- nessuna schermata standard mostra più di una CTA primaria;
- Home mobile non supera circa 1,5 viewport senza contenuti storici;
- almeno l’80% degli utenti di un test moderato completa Genera → Registra senza assistenza;
- le informazioni tecniche non sono visibili finché l’utente non le apre.

# Handoff per Alvaro

Non serve riscrivere il motore. La revisione deve intervenire soprattutto su composizione e disclosure:

- mantenere hook, storage, worker e API;
- rifattorizzare `DashboardView`, `GeneratorPanel`, `TicketPreview`, `TicketHistory`, `SettingsView` e `OnboardingDialog`;
- introdurre uno stato del flusso `configure | result` nella pagina Genera;
- estrarre azioni secondarie in un menu accessibile;
- conservare tutti i dati tecnici, ma spostarli fuori dal percorso principale.

**Decisione Yuma:** l’interfaccia attuale non va rifinita aggiungendo altro design. Va prima **ridotta di circa il 40–50% nei contenuti visibili e nel numero di controlli**.
