# Implementación Yuma UX — v12.1

## Decisiones aplicadas

- Sustitución del bloque automático del próximo sorteo por una elección explícita del juego.
- Reducción del inicio a la acción principal y al estado relevante del usuario.
- Un único control para columnas y presupuesto.
- Números y registro como prioridad después de generar.
- Métricas, distribución, copia y voz dentro de detalles opcionales.
- Desplazamiento automático al resultado en pantallas pequeñas.

## Flujo final

```text
Elegir juego → fijar presupuesto → generar → revisar → registrar o guardar
```
