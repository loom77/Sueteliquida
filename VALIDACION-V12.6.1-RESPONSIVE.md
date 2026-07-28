# Validación Primy v12.6.1 — Generador responsive

## Incidencia corregida

Al mostrar un boleto generado, `GenerateView` activaba una cuadrícula de dos columnas en pantallas de portátil. Dentro de la columna izquierda, `GeneratorPanel` mantenía otra cuadrícula con una columna fija de 270 px para la mascota. La combinación de ambas cuadrículas comprimía los controles, el texto y el botón hasta mostrarlos en una columna vertical.

## Solución

- División generador/boleto reservada para pantallas `2xl` con anchos mínimos explícitos.
- En portátiles y pantallas medianas, el boleto se muestra debajo del generador.
- El panel recibe `layout="compact"` cuando existe un resultado.
- En modo compacto, la mascota se transforma en un banner horizontal.
- Elementos de cuadrícula protegidos con `min-w-0`.
- Botón de generación con ancho y line-height resistentes a la compresión.

## Verificaciones

- 38 pruebas funcionales superadas.
- 47 archivos JavaScript/JSX validados sintácticamente.
- Importaciones relativas verificadas.
