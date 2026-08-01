# Primy — Audit UX/UI e piano di restyling v16

**Base analizzata:** Primy v15.9.0 — Quiniela Simple Operational  
**Ambito:** interfaccia, gerarchia, coerenza del brand, uso della mascotte, motion design, accessibilità e scalabilità verso Quiniela/Quinigol.

## 1. Valutazione sintetica

| Area | Valutazione | Diagnosi |
|---|---:|---|
| Chiarezza della navigazione | 7/10 | Le cinque sezioni principali sono comprensibili, ma la sidebar aggiunge un blocco promozionale e un secondo uso del marchio che appesantiscono la scansione. |
| Gerarchia delle schermate | 5/10 | Molte pagine presentano troppi blocchi con peso visivo simile. L’azione principale non sempre domina. |
| Coerenza del brand | 6/10 | Logo, verde e gufo sono presenti, ma convivono con colori di gioco e componenti precedenti non ancora ricondotti a un sistema unico. |
| Consistenza dei componenti | 5/10 | Esistono componenti di base, ma una parte significativa di pulsanti, card, callout e conferme viene ancora costruita localmente. |
| Densità e ripetizioni | 4/10 | Primy Core, disclaimer, gioco responsabile, dati e spiegazioni ricompaiono in più punti. |
| Uso della mascotte | 5/10 | La mascotte è efficace, ma compare in troppi contesti e non segue ancora una funzione rigorosamente assegnata. |
| Motion design | 5/10 | Sono presenti numerose animazioni CSS, ma manca una regia unica del movimento e non esiste ancora il rituale di elaborazione richiesto. |
| Accessibilità | 8/10 | Focus, skip link, `aria-live`, dialoghi accessibili e `prefers-reduced-motion` sono una buona base. |
| Scalabilità verso giochi sportivi | 5/10 | Il layout attuale è adatto alle lotterie numeriche, ma rischia di diventare troppo lungo e frammentato per 14–15 partite sportive. |

**Valutazione complessiva:** 5,6/10. La base è solida, ma serve una vera fase di consolidamento, non un semplice ritocco estetico.

---

## 2. Evidenze tecniche dell’audit

- `src/index.css` contiene **1.312 righe** e **86 classi personalizzate `primy-*`**.
- Il design system React contiene soltanto quattro primitive principali: `PrimaryButton`, `SecondaryButton`, `ActionCard` ed `Eyebrow`.
- Nel codice JSX sono presenti almeno **112 occorrenze di `rounded-2xl`**, **18 di `rounded-3xl`** e **111 di `rounded-xl`**. Questo conferma la proliferazione di superfici arrotondate con livelli gerarchici poco distinguibili.
- **13 componenti** utilizzano direttamente la mascotte o i suoi asset.
- **9 file** gestiscono dialoghi o conferme, con diverse strutture costruite localmente.
- La stringa o il concetto **“Primy Core” compare 23 volte** nel codice sorgente.
- Sono presenti numerosi colori di stato e di gioco distribuiti localmente: verde Primy, lime, ambra, sky, violet, rose ed emerald.
- Il progetto dispone già di supporto a `prefers-reduced-motion`, ma le animazioni sono distribuite tra molti selettori senza una scala di motion centralizzata.

Questi dati non indicano codice scadente: mostrano che il prodotto è cresciuto più rapidamente del suo sistema visuale.

---

## 3. Problemi prioritari

### P0. Troppi elementi con lo stesso peso visivo

Home, generatore, archivio e profilo usano frequentemente card bianche, bordi sottili, radius elevati e ombre leggere. Il risultato è una sequenza di moduli visivamente equivalenti.

**Conseguenza:** l’utente deve leggere quasi tutto per capire dove agire.

**Correzione:** introdurre soltanto tre livelli di superficie:

1. **Page surface:** sfondo generale, senza contenitore aggiuntivo.
2. **Section surface:** blocco principale della schermata.
3. **Inset surface:** elemento secondario interno, utilizzato con moderazione.

Le “card dentro card” saranno rimosse quando non servono a separare un’interazione autonoma.

### P0. Primy Core è sovraesposto

Il concetto compare nella home, nel percorso di creazione, nel generatore, nei risultati, nel profilo, nell’onboarding e nei contenuti informativi.

**Conseguenza:** ciò che dovrebbe essere un elemento distintivo diventa rumore ricorrente.

**Correzione:** una sola definizione condivisa e due punti di accesso:

- onboarding iniziale;
- link discreto “Cómo funciona Primy” nell’Help Center/Profilo.

Durante la generazione si userà semplicemente “Primy está preparando tu jugada”, senza ripetere la spiegazione tecnica.

### P0. Azione principale non sempre dominante

Nel risultato della giocata sono presenti registrazione, salvataggio, dettagli, copia, ascolto, metriche, spiegazioni del motore, rigenerazione e scarto.

**Conseguenza:** il momento più importante — decidere se registrare o conservare la giocata — compete con troppe azioni.

**Correzione:** risultato organizzato in tre livelli:

1. boleto e costo;
2. CTA principale “Registrar boleto” e secondaria “Guardar borrador”;
3. menu “Más opciones” per copia, ascolto, dettagli e scarto.

### P0. Profilo sovraccarico

La schermata Profilo riunisce identità, budget, età, notifiche, installazione, backup, provider, onboarding, Primy Core, laboratorio storico, consiglio responsabile, cancellazione e disclaimer.

**Correzione:** suddividere in quattro sezioni navigabili:

- **Cuenta**
- **Límites y avisos**
- **Datos y copias**
- **Ayuda y legal**

Il laboratorio statistico non deve trovarsi nel profilo: appartiene a un’area “Analisi” o ai dettagli avanzati del gioco.

### P1. Sidebar desktop troppo promozionale

La sidebar presenta wordmark, grande pannello marketing, navigazione, avatar mascotte, dati account e logout.

**Conseguenza:** il marchio viene ripetuto e lo spazio verticale disponibile diminuisce.

**Correzione:**

- wordmark compatto in alto;
- navigazione immediatamente sotto;
- rimuovere il pannello “Todo lo que necesitas…”;
- account compatto in basso;
- utilizzare il gufo solo come avatar, non insieme a un secondo marchio illustrato.

### P1. Home ancora troppo lunga

La home contiene hero, prossimo sorteggio, due CTA, disclaimer, eventuale controllo, tre metriche, ultime giocate, due quick action e footer informativo.

**Nuova home:**

1. saluto + CTA “Preparar jugada”;
2. prossimo evento;
3. stato principale: ultima giocata oppure controllo pendente;
4. due collegamenti rapidi.

Le metriche mensili passano all’Archivio o al Profilo.

### P1. Colori dei giochi competono con Primy

Il generatore modifica label, icona, pannello, helper, progress bar e CTA in funzione del gioco.

**Conseguenza:** ogni gioco sembra una piccola app diversa.

**Correzione approvata:**

- CTA sempre verde Primy;
- selezione attiva sempre verde Primy;
- colore del gioco confinato a badge, linea laterale, piccolo pittogramma o testata attenuata;
- stati semantici riservati a successo, attenzione ed errore.

### P1. Uso della mascotte non governato

La mascotte compare in autenticazione, home, generatore, dialoghi, onboarding, errori, migrazione, impostazioni, storico e risultati.

**Nuova matrice d’uso:**

| Funzione | Variante | Dove appare |
|---|---|---|
| Benvenuto | Welcome | onboarding e prima home, una sola volta |
| Elaborazione | Thinking | overlay di generazione |
| Conferma | Celebration | salvataggio riuscito o premio, non in ogni risultato |
| Assistenza | Helper | help contestuale complesso |
| Responsabilità | Responsible | budget/limiti e pagina gioco responsabile |
| Vuoto | Empty | archivi realmente vuoti |

**Regola:** massimo un gufo protagonista per schermata.

### P1. Conferme costruite in modi differenti

Alcune conferme utilizzano dialoghi condivisi, altre blocchi inseriti dentro le card del risultato.

**Correzione:** creare una sola famiglia:

- `ConfirmDialog`
- `ActionSheet` mobile
- `InlineNotice` per messaggi che non richiedono una decisione modale

### P2. Terminologia e microcopy

Sono presenti “Crear”, “Preparar”, “Registrar”, “Añadir boleto”, “He jugado” e “Guardar como borrador”. Tutti sono corretti, ma il modello mentale deve essere reso più sistematico.

**Vocabolario ufficiale:**

- **Preparar**: creare una proposta non acquistata.
- **Guardar borrador**: conservarla senza dichiararla acquistata.
- **Registrar boleto**: confermare che il boleto è stato acquistato.
- **Comprobar**: confrontarlo con un risultato ufficiale.

---

## 4. Nuova architettura visiva

### Navigazione

- Inicio
- Preparar
- Juegos
- Archivo
- Perfil

La struttura attuale è corretta e viene mantenuta. Cambiano densità, icone attive e gerarchia.

### Sistema di superfici

| Token | Uso |
|---|---|
| `surface-page` | sfondo generale avorio/mint quasi neutro |
| `surface-section` | contenuto principale, bordo minimo |
| `surface-inset` | controlli o dati subordinati |
| `surface-brand` | momenti Primy ad alto valore, uso raro |
| `surface-status-*` | successo, attenzione, errore, informazione |

### Radius

- 12 px: input e controlli piccoli
- 16 px: card standard
- 24 px: hero o modali importanti
- pill: badge e segmenti

Saranno eliminati i radius arbitrari e l’uso indiscriminato di `rounded-2xl`/`rounded-3xl`.

### Colori

- Primario: `#0B7A49`
- Primario scuro: `#075438`
- Accent brand: `#FFD052`
- Background mint: `#EAF7F1`
- Background avorio: `#FFFDF7`
- Testo principale: verde-notte/navy

I colori dei giochi diventano **accenti secondari**, non colori delle CTA.

---

## 5. Motion system

### Tempi standard

- microinterazione: 120–160 ms
- cambio di stato: 180–220 ms
- apertura pannello/dialogo: 220–280 ms
- entrata pagina: 240 ms
- celebrazione: massimo 900 ms

### Elaborazione Primy di almeno quattro secondi

La richiesta viene approvata con una distinzione fondamentale: l’attesa si applica alla **generazione automatica**, non alle azioni manuali o alla navigazione.

Sequenza proposta:

| Tempo | Messaggio |
|---:|---|
| 0,0–1,0 s | Revisando las reglas del juego… |
| 1,0–2,1 s | Comprobando el coste y tus límites… |
| 2,1–3,2 s | Preparando la combinación… |
| 3,2–4,0 s | Haciendo la última revisión… |

Comportamento:

- overlay non bloccante ma focalizzato;
- mascotte Thinking;
- progress bar con avanzamento reale delle fasi;
- reveal progressivo dei numeri dopo 4 secondi;
- pulsante “Cancelar” disponibile;
- con `prefers-reduced-motion`, niente movimento decorativo ma durata e messaggi restano coerenti;
- non vengono dichiarate analisi matematiche non realmente eseguite.

Per Quiniela e Quinigol, quando il modello statistico sarà attivo, le fasi potranno descrivere operazioni reali di probabilità e copertura.

---

## 6. Piano di implementazione

### Sprint A — Fondazione visuale

1. Creare token centralizzati per colore, spacing, radius, ombre e motion.
2. Espandere `DesignSystem.jsx` con:
   - `Button`
   - `Card`
   - `SectionHeader`
   - `StatusNotice`
   - `EmptyState`
   - `PageHeader`
   - `SegmentedControl`
   - `ActionMenu`
3. Eliminare colori e radius locali non necessari.
4. Centralizzare i ruoli della mascotte.

### Sprint B — Navigazione e home

1. Semplificare sidebar e header mobile.
2. Ridurre home a quattro blocchi principali.
3. Rimuovere ripetizioni di Primy Core e disclaimer.
4. Spostare statistiche e dettagli nell’Archivio.

### Sprint C — Creazione e risultato

1. Unificare il percorso numerico, Lotería Nacional e Quiniela.
2. Integrare il rituale Thinking da 4 secondi.
3. Ridurre il risultato alle decisioni essenziali.
4. Spostare azioni accessorie in “Más opciones”.

### Sprint D — Archivio e profilo

1. Ridurre filtri e card dell’Archivio.
2. Separare il Profilo in quattro sezioni.
3. Consolidare backup, provider e informazioni tecniche.
4. Unificare cancellazioni e conferme.

### Sprint E — QA

1. Contrasto WCAG 2.2 AA.
2. Navigazione tastiera.
3. Lettori di schermo.
4. Riduzione del movimento.
5. Test mobile 320–430 px, tablet e desktop.
6. Controllo delle prestazioni delle animazioni.

---

## 7. Decisione del team

Il team approva un **restyling strutturale v16**, con queste condizioni:

- nessuna modifica al motore matematico o alle regole dei giochi;
- nessuna perdita di funzioni esistenti;
- nuova UI applicata prima ai flussi principali;
- Quiniela e Quinigol proseguono soltanto sui nuovi componenti;
- la mascotte viene utilizzata come agente funzionale, non come decorazione ripetitiva;
- le CTA restano coerenti con il verde Primy;
- il ritardo di quattro secondi viene applicato esclusivamente alla generazione automatica e rappresentato in modo trasparente.

**Esito dell’audit:** restyling necessario e approvato. La prima implementazione deve partire dal design system, dalla navigazione e dalla home, perché sono le fondamenta di tutte le schermate successive.
