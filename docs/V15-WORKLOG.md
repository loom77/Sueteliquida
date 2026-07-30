# Primy v15 — Worklog técnico

## Arquitectura

- `src/App.jsx` reducido a autenticación, age gate y montaje de la aplicación.
- `useAppController` coordina datos y props, sin contener el render principal.
- `useGenerationController` encapsula el ciclo de vida del Web Worker.
- `usePlayActions` encapsula guardar, repetir, crear variante, eliminar y restaurar.
- `useResultChecking` encapsula comprobaciones por juego y globales.
- `AppViews` y `AppOverlays` separan navegación, lazy loading y diálogos.
- `ViewErrorBoundary` evita que un error localizado derribe toda la sesión.

## UX/UI

- Home con una CTA principal y sin acciones duplicadas.
- Resumen mensual y acceso compacto a las dos últimas jugadas.
- Cancelación visible durante generación y simulación Monte Carlo.
- Toasts con pausa al pasar el cursor o enfocar una acción.
- Límite mensual solo se guarda cuando el valor ha cambiado.

## Accesibilidad

- Foco trasladado al contenido principal tras cambiar de vista.
- Badges de pendientes con etiqueta para lectores de pantalla.
- Estados de sincronización y progreso anunciados.
- Controles principales con altura táctil mínima de 44 px.

## PWA

- Assets y cachés con versión v15.
- Shortcuts del manifest para `/crear` y `/archivo`.
- Backup y almacenamiento local marcados como versión 15.

## Archivo de jugadas

- Eliminación directa disponible en escritorio, móvil y detalle.
- Confirmación obligatoria incluso para jugadas registradas como compradas.
- El aviso aclara que borrar el registro de Primy no anula el boleto ni la apuesta real.
- Se conserva la restauración mediante “Deshacer”.

## Validación

- 56/56 pruebas Node superadas.
- 97 archivos `.js`/`.jsx` parseados sin errores mediante TypeScript parser.
- Importaciones locales verificadas: 0 rutas ausentes.
- Instalación/build no ejecutada en el entorno de entrega porque el registry interno devuelve 404 para `@supabase/supabase-js@2.57.4`; el registry público agotó el timeout de red.
