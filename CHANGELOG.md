# PRIMY v18.3.0 — Core Journey + Schedule Integrity

## Nuevas funciones y correcciones
- El próximo sorteo de Home ahora respeta el cierre de preparación (`salesCloseISO`).
- La tarjeta indica claramente el juego, la fecha, la hora del sorteo y la hora límite de preparación.
- Los motores de generación y repetición usan el próximo sorteo todavía jugable.
- El caso Primitiva del 8/08/2026 a las 21:25 queda cubierto por test de regresión.
- El flujo Preparar se reorganiza en cinco pasos: Juego, Configura, Crea, Revisa y Guarda.
- La revisión del boleto queda separada del configurador.
- Se añade un botón “Modificar configuración” antes de guardar.
- Se hace determinista la validación temporal de Quinigol usando el `createdAt` de la jugada.

# PRIMY v18.2.0 — Android Design System

## Web app

- Introduzione dei token semantici Material 3 condivisi con la futura app Android.
- Touch target minimo portato a 48 px.
- Aggiunto il layer `android-design-system.css`, caricato dopo gli stili legacy.
- Navigazione mobile a quattro destinazioni normalizzata in stile Android.
- KPI mensili migrati al nuovo componente `MetricCard`.
- Percorso di creazione migrato a `ProgressSteps`: Juego, Configura, Crea, Guarda.
- Nuovi componenti: `IconButton`, `Chip`, `MetricCard`, `AdaptiveGrid`, `ProgressSteps`.
- Token aggiornati per colore, tipografia, spaziatura, shape, elevazione e motion.
- Supporto esplicito a layout Compact, Medium ed Expanded.
- Il nuovo gufo ufficiale PRIMY resta la reference cross-platform.

## Qualità

- 265 test superati.
- Release guard superato.
- Parsing JSX/JavaScript con TypeScript superato.
- Parsing CSS superato.
- La build Vite non è stata eseguita nell'ambiente locale perché il registry disponibile non fornisce `@supabase/supabase-js`; deve essere eseguita nel deploy GitHub/Vercel con accesso npm standard.
