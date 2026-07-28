# Investigación algorítmica de Primy

## Principio central

Ningún análisis del historial puede convertir una lotería correctamente operada en un sistema predecible. Primy utiliza el historial para medir distribución, cobertura y diversidad, no para prometer números ganadores.

## Decisiones del motor

- Base aleatoria uniforme cuando no existe evidencia fuera de muestra.
- Peso histórico limitado incluso cuando aparece una desviación persistente.
- Optimización de cartera para reducir solapamientos entre columnas.
- Separación entre probabilidad de acierto y posible reparto del premio.
- Repetibilidad mediante semilla para facilitar auditorías y pruebas.

## Criterio de aceptación

Una mejora solo se incorpora si supera una comparación fuera de muestra frente a una referencia aleatoria y mantiene las reglas oficiales del juego. La interfaz debe explicar siempre que los resultados siguen siendo aleatorios.
