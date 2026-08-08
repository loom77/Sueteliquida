# PRIMY v18.3.0 — Deploy handoff

## Objetivo
Esta release implementa el Core Journey y corrige la integridad temporal de los sorteos disponibles para preparar jugadas.

## Fix crítico de horarios
La Home y los motores de generación ya no usan solo la hora del sorteo para decidir si una jugada sigue disponible. Usan `salesCloseISO` mediante `getNextPlayableDrawInfo()`.

Caso de regresión cubierto:
- sábado 8/08/2026 21:25 Europe/Madrid
- La Primitiva sorteaba a las 21:40
- cierre configurado: 21:15
- resultado esperado: no mostrar ni generar para el sorteo del 8/08; usar el lunes 10/08 a las 21:40.

## Cambios UX
- La tarjeta de Home identifica explícitamente el juego.
- Se muestra “Próximo sorteo disponible”.
- Se muestra el límite de preparación.
- El journey pasa a 5 fases: Juego → Configura → Crea → Revisa → Guarda.
- La revisión es una pantalla/sección dedicada, ya no un panel lateral junto al configurador.

## Deploy
1. Sustituir el contenido del repositorio por este paquete o aplicar la patch-only.
2. Ejecutar `npm install`.
3. Ejecutar `npm run release:check`.
4. Desplegar en Vercel.
5. Verificar manualmente el caso horario indicado arriba.

## Nota de build local
En el entorno de preparación no estaba instalado el binario `vite`, por lo que `npm run build` devuelve `vite: not found`. La suite Node y el release guard sí se ejecutaron correctamente.
