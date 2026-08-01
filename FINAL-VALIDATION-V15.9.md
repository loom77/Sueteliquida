# Validación final — Primy v15.9.0

## Producto

- La Quiniela simple usa una pantalla propia y no reutiliza el generador numérico.
- La composición procede del archivo oficial deportivo.
- Se requieren 14 signos y los dos valores del Pleno al 15.
- El coste visible es de 0,75 €.
- La jugada se guarda únicamente como borrador no comprado.
- No se exponen múltiples, Elige8, reducidas, condicionadas ni comprobación incompleta.

## Ingeniería

- Nuevo modelo `quinielaPlay` con sanitización específica.
- Snapshot de jornada, revisión y huella de fuente conservados en la jugada.
- Hook de lectura de jornada con cancelación y recarga manual.
- Integración en creación, catálogo, selector de juegos y Archivo.
- El laboratorio numérico no consulta el endpoint histórico cuando el juego activo es Quiniela.

## Validación ejecutada

- 143 tests automáticos superados.
- 149 archivos JS, JSX, MJS, TS y TSX analizados sin errores sintácticos.
- 0 importaciones locales ausentes.
- ZIP final verificado.

## Limitación del entorno

`npm run build` no puede ejecutarse en este entorno porque las dependencias no están instaladas y el comando `vite` no está disponible. No se han sustituido ni modificado las versiones declaradas. El gate de despliegue debe ejecutar:

```bash
npm install
npm test
npm run build
```
