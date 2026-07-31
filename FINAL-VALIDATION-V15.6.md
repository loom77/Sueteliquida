# Validación final — Primy v15.6.0

## Producto

- Lotería Nacional dispone de flujo dedicado.
- Preparar y registrar están claramente separados.
- La disponibilidad comercial no se presenta como confirmada.
- No existen mensajes de predicción o garantía de premios.

## Reglas

- Ceros iniciales preservados.
- Costes y cantidad de décimos validados.
- Serie y fracción conservadas.
- Comprobación con listado oficial completo y estado pendiente ante datos incompletos.
- Prioridad correcta entre premio principal acumulativo y categorías inferiores.

## UX/UI

- Selección del sorteo, número, cantidad y coste visibles en un único flujo.
- Diseño específico de décimo, responsive y compatible con teclado.
- Evolución de logo e iconografía aplicada a PWA y cabecera.

## Ingeniería

- Migración Supabase incluida y aplicada.
- Función dedicada `sync-loteria-nacional` incluida.
- Scheduler preparado para invocar la sincronización del nuevo juego.
- 104 tests automáticos superados, 116 archivos JS/JSX/TS/TSX analizados sin errores de sintaxis y 250 importaciones locales resueltas sin ausencias.

## Limitación de validación

El build Vite completo requiere instalar dependencias. En el entorno de generación el registro npm interno no distribuye `@supabase/supabase-js@2.57.4`; por ello la validación se apoya en tests Node, parser TypeScript e inspección de importaciones, sin afirmar un build local que no se ha ejecutado.
