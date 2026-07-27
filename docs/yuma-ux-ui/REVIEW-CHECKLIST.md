# Checklist di revisione Yuma UX/UI

## 1. Persona e obiettivo
- Chi utilizza questa schermata?
- Qual è il compito principale?
- Quale informazione è necessaria prima di agire?
- Quale errore sarebbe più costoso o frustrante?

## 2. User flow
- L'azione primaria è evidente entro pochi secondi?
- Il flusso elimina passaggi o inserimenti ridondanti?
- Gli stati vuoto, caricamento, errore, successo e offline sono comprensibili?
- Il sistema permette di annullare o correggere azioni non distruttive?

## 3. Architettura dell'informazione
- I contenuti sono raggruppati in chunk coerenti?
- Azioni, dati operativi e dettagli tecnici sono separati?
- Le etichette corrispondono al linguaggio dell'utente?
- La navigazione segue modelli mentali familiari?

## 4. UI e design system
- Spaziatura basata su multipli di 8px, con eccezioni motivate?
- Una sola CTA primaria per area o fase del flusso?
- Gerarchia tipografica e cromatica coerente?
- Pattern e componenti riutilizzabili invece di eccezioni locali?
- Layout verificato da 320px fino al desktop ampio?

## 5. Accessibilità WCAG 2.2 AA
- Focus sempre visibile e non coperto da contenuti sticky o modali.
- Target interattivi almeno 24×24 CSS px; obiettivo interno Primy: 44×44 px per i controlli principali.
- Alternative a interazioni basate esclusivamente sul trascinamento.
- Help e assistenza collocati in modo coerente.
- Nessun reinserimento inutile di dati già forniti nella stessa sessione.
- Autenticazione, se introdotta, compatibile con password manager, incolla e WebAuthn/passkey.
- Contrasto, zoom, tastiera, screen reader e reduced motion verificati.

## 6. Psicologia del design
- Jakob: usare convenzioni familiari salvo vantaggio dimostrabile.
- Fitts: target grandi, vicini all'azione e ben distanziati.
- Miller: organizzare e raggruppare, non applicare dogmaticamente il numero sette.
- Hick: ridurre scelte simultanee e usare progressive disclosure.
- Peak–End: curare in particolare il momento di risultato e la conclusione del flusso.
- Von Restorff: evidenziare una sola azione o informazione prioritaria.
- Doherty: fornire feedback percepibile rapidamente e non lasciare l'utente senza stato.

## 7. Esito
Ogni audit deve classificare i problemi come P0, P1 o P2 e indicare:
- evidenza;
- impatto;
- correzione proposta;
- criterio di accettazione;
- test necessario.
