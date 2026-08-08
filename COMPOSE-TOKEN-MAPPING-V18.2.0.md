# PRIMY v18.2.0 — Mapping Web → Jetpack Compose

## Tema

| Web | Jetpack Compose |
|---|---|
| `--md-sys-color-primary` | `MaterialTheme.colorScheme.primary` |
| `--md-sys-color-on-primary` | `MaterialTheme.colorScheme.onPrimary` |
| `--md-sys-color-primary-container` | `MaterialTheme.colorScheme.primaryContainer` |
| `--md-sys-color-secondary` | `MaterialTheme.colorScheme.secondary` |
| `--md-sys-color-tertiary` | `MaterialTheme.colorScheme.tertiary` |
| `--md-sys-color-surface` | `MaterialTheme.colorScheme.surface` |
| `--md-sys-color-surface-variant` | `MaterialTheme.colorScheme.surfaceVariant` |
| `--md-sys-color-error` | `MaterialTheme.colorScheme.error` |

## Componenti

| React/Web | Compose |
|---|---|
| `Button variant="primary"` | `Button` |
| `Button variant="secondary"` | `OutlinedButton` |
| `Button variant="ghost"` | `TextButton` |
| `IconButton` | `IconButton` / `FilledTonalIconButton` |
| `Card` | `Card` / `ElevatedCard` |
| `Chip` | `FilterChip` / `AssistChip` |
| `MetricCard` | `Card` con semantics e stateDescription |
| `AdaptiveGrid` | `LazyVerticalGrid` o pane adattivo |
| `ProgressSteps` | composable custom con `Row` e semantics |
| `SegmentedControl` | `SingleChoiceSegmentedButtonRow` |
| `StatusNotice` | `Card`/banner semantico |
| `ActionMenu` | `DropdownMenu` |

## Dimensioni

- Touch target: `48.dp`.
- Pulsante grande: `56.dp`.
- NavigationBar: Material 3 standard più system insets.
- Spaziatura: scala `4.dp`.
- Card standard: `18.dp` circa, da armonizzare con `RoundedCornerShape`.
- Feature: `28.dp` circa.

## Window size

```kotlin
when (windowSizeClass.widthSizeClass) {
    WindowWidthSizeClass.Compact -> CompactLayout()
    WindowWidthSizeClass.Medium -> MediumLayout()
    WindowWidthSizeClass.Expanded -> ExpandedLayout()
}
```

## Navigazione

Destinazioni principali:

1. Inicio
2. Preparar
3. Archivo
4. Perfil

`Juegos` è parte del flusso Preparar e non una destinazione principale separata.

## KPI mensili

Il composable Android dovrà esporre:

- label;
- importo formattato;
- descrizione del criterio;
- tono semantico;
- azione per aprire il dettaglio riconciliabile;
- `contentDescription` e `stateDescription` per TalkBack.

## Motion e accessibilità

- Rispettare `LocalMotionDurationScale`.
- Evitare animazioni indispensabili per comprendere lo stato.
- Supportare TalkBack, font scale 2.0 e contrasto elevato.
- Usare `WindowInsets.safeDrawing`, `imePadding()` e `navigationBarsPadding()`.
