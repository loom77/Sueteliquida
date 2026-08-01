# Primy v15.7.0 — Fundación matemática de apuestas deportivas

## Alcance del hito

Este hito crea una base técnica y científica separada para **La Quiniela** y **El Quinigol**. No activa todavía la preparación ni el registro de boletos deportivos en producción.

La prioridad es impedir que los pronósticos deportivos reutilicen por error el modelo uniforme de las loterías numéricas.

## Arquitectura añadida

```text
src/sports/
├── constants.js
├── probability.js
├── goalModel.js
├── roundModel.js
├── quinielaRules.js
├── quinigolRules.js
├── scenarioEngine.js
├── modelEvaluation.js
└── index.js
```

## Modelo de jornada

Cada jornada conserva:

- identificador del juego y de la jornada;
- temporada y número oficial;
- apertura y cierre de ventas;
- estado de la jornada;
- fuente, hash y fecha de actualización;
- partidos ordenados por la posición oficial del boleto.

Cada partido conserva equipos, competición, hora, estado, resultado oficial y posibles exclusiones. La validación detecta posiciones o identificadores duplicados y nunca completa partidos inexistentes.

## Modelo probabilístico

El núcleo recibe intensidades de gol local y visitante y construye una matriz de marcadores mediante Poisson, con ajuste Dixon-Coles en los resultados bajos.

De la misma matriz se derivan:

- probabilidades `1-X-2` para los catorce primeros partidos de La Quiniela;
- distribución `0-1-2-M` para el Pleno al 15;
- las dieciséis casillas de cada encuentro de El Quinigol.

Cada snapshot conserva versión del modelo, hora de generación, corte temporal de datos, parámetros, fuente y advertencias.

## Combinatoria de La Quiniela

La implementación incluye:

- catorce selecciones `1-X-2`;
- Pleno al 15 con `0`, `1`, `2` y `M` por equipo;
- desarrollo directo por producto cartesiano;
- coste unitario parametrizado;
- condiciones por variantes, empates y signos `2`;
- Elige8 sobre exactamente ocho posiciones;
- conversión de marcadores a resultado oficial y comprobación por columna.

Las seis reducidas están catalogadas por dimensiones y número de apuestas. Sus matrices y garantías continúan marcadas como pendientes de importación y verificación oficial: Primy no inventa patrones reducidos.

## Combinatoria de El Quinigol

La implementación incluye:

- dieciséis resultados por partido;
- seis partidos por boleto;
- desarrollo múltiple por producto cartesiano;
- límite preventivo de desarrollo;
- agregación de tres o más goles mediante `M`;
- comprobación exacta de categorías por número de aciertos.

## Simulación y validación científica

El motor Monte Carlo utiliza una semilla reproducible y evalúa la mejor columna de una cartera frente a escenarios muestreados desde las matrices probabilísticas.

La evaluación del modelo incluye:

- log-loss multiclase;
- Brier score;
- curvas de calibración por intervalos;
- detección explícita de datos o predicciones posteriores al inicio del partido.

La exactitud del signo más probable no se utiliza como única medida de calidad.

## Gate de publicación

Las acciones deportivas siguen bloqueadas. Antes de activarlas deben completarse:

1. proveedor oficial de jornadas y resultados;
2. repositorio persistente y versionado;
3. interfaz accesible de Quiniela y Quinigol;
4. matrices oficiales de reducidas;
5. comprobación de jornadas excluidas o modificadas;
6. validación temporal con datos históricos reales;
7. revisión legal, UX y juego responsable.


## Continuación v15.8.0

El proveedor oficial y el repositorio persistente se implementan en `SPORTS-DATA-FOUNDATION-V15.8.md`.
