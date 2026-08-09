# PRIMY v18.2.0 — Android Design System

## Obiettivo

Questa release introduce un sistema visivo condiviso tra la web app e la futura app Android nativa. La web app resta in React, ma colori semantici, spaziature, forme, elevazioni, movimento e componenti sono organizzati in modo da poter essere tradotti senza ambiguità in Material 3 e Jetpack Compose.

Il nuovo gufo PRIMY rimane la reference ufficiale cross-platform del brand.

## Principi

1. **Android-first:** controlli utilizzabili con una mano, touch target minimo di 48 px e navigazione stabile.
2. **Trasparenza:** niente estetica da casinò, claim ingannevoli o segnali che suggeriscano una vincita probabile.
3. **Una gerarchia chiara:** una CTA primaria per contesto, azioni secondarie meno dominanti.
4. **Adattività reale:** Compact, Medium ed Expanded, non semplice ingrandimento del layout mobile.
5. **Parità web/Android:** ogni token e componente principale ha un equivalente Compose definito.

## Colori semantici

| Ruolo | Token web | Uso |
|---|---|---|
| Primary | `--md-sys-color-primary` | CTA, stato attivo, navigazione |
| Primary container | `--md-sys-color-primary-container` | indicatori, chip e selezioni |
| Secondary | `--md-sys-color-secondary` | contenuti secondari |
| Tertiary | `--md-sys-color-tertiary` | accento oro limitato |
| Surface | `--md-sys-color-surface` | card e pannelli |
| Surface variant | `--md-sys-color-surface-variant` | aree inset e filtri |
| Error | `--md-sys-color-error` | errori e risultato negativo |
| Success | `--ds-success` | premi confermati e risultato positivo |

La palette mantiene verde bosco, crema e oro come identità principale. I colori dei singoli giochi restano accenti funzionali e non sostituiscono il brand PRIMY.

## Tipografia

- Display Large: hero e messaggio principale.
- Headline Large/Medium: titoli di pagina e sezioni.
- Title Large/Medium: card e dialoghi.
- Body Large/Medium: contenuto e spiegazioni.
- Label Large/Medium: pulsanti, chip e metadati.

I testi devono tollerare font di sistema al 200% senza perdita di contenuto o sovrapposizioni.

## Spaziatura e forme

La griglia è basata su multipli di 4 px. I valori principali sono esposti tramite `--ds-space-*`.

- Controlli: raggio `0.875rem`.
- Card: raggio `1.125rem`.
- Feature e hero: raggio `1.75rem`.
- Pill e indicatori: raggio completo.

## Elevazione

Sono definiti quattro livelli:

- Level 0: nessuna ombra.
- Level 1: card standard.
- Level 2: componenti interattivi e hover web.
- Level 3: hero, feature e pannelli dominanti.

Su Android questi livelli dovranno essere tradotti con `CardDefaults.cardElevation` e tonal elevation Material 3, evitando ombre eccessive.

## Motion

- Fast: 120 ms.
- State: 180 ms.
- Panel: 240 ms.
- Page: 220 ms.
- Celebration: 800 ms.

Tutte le transizioni rispettano `prefers-reduced-motion`. Nell'app Android dovranno rispettare la scala animazioni del sistema.

## Breakpoint adattivi

| Classe | Web | Destinazione Android |
|---|---:|---|
| Compact | `< 600 px` | Smartphone |
| Medium | `600–839 px` | Tablet compatto/foldable |
| Expanded | `>= 840 px` | Tablet e finestre ampie |

La futura app Android utilizzerà `WindowSizeClass` invece di media query.

## Componenti condivisi

- `Button`
- `IconButton`
- `Card`
- `Chip`
- `MetricCard`
- `AdaptiveGrid`
- `ProgressSteps`
- `SectionHeader`
- `PageHeader`
- `StatusNotice`
- `EmptyState`
- `SegmentedControl`
- `ActionMenu`
- `ActionCard`

## Cambiamenti visibili nella web app

- KPI mensili migrati a `MetricCard`, con icone, descrizione e tono semantico.
- Barra inferiore Android ridisegnata per quattro destinazioni.
- Touch target uniformati ad almeno 48 px.
- Indicatori e selezioni basati sui container Material 3.
- Percorso Preparar mostrato con `ProgressSteps`: Juego, Configura, Crea, Guarda.
- Card, header, pulsanti e stati focus normalizzati tramite un layer CSS caricato dopo gli stili legacy.
- Migliore comportamento su smartphone, tablet e font grandi.

## Regole per il gufo ufficiale

- Asset principale: `/public/mascot/primy-official-v18.png`.
- Usarlo in onboarding, Home, Primy Core, stati vuoti, conferme e assistenza.
- Non ripeterlo in ogni card.
- Non deformare proporzioni, colori o espressione.
- Per Android verranno creati asset ottimizzati e adattivi derivati dalla stessa reference, senza cambiare il personaggio.

## Criteri di accettazione

- Touch target minimo 48 px.
- Focus visibile da tastiera.
- Nessuna CTA coperta dalla navigazione inferiore.
- Contrasto semantico mantenuto in tema chiaro e scuro.
- Layout Compact, Medium ed Expanded verificabili.
- Componenti traducibili direttamente in Jetpack Compose.
