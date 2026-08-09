# Deploy handoff — PRIMY v18.4.0

## Paquete recomendado
Usar `Primy-v18.4.0-Draw-Selection-Data-Contract.zip` como árbol completo del repositorio.

## Comandos de CI/deploy
```bash
npm install
npm run release:check
```

## Smoke tests después del deploy
1. Abrir Home: no debe aparecer «Próximo sorteo disponible».
2. Pulsar «Elegir juego» y seleccionar La Primitiva.
3. En Preparar deben aparecer varias fechas con hora de sorteo y hora de cierre.
4. Seleccionar la segunda fecha disponible.
5. Generar y revisar: el boleto debe mostrar esa segunda fecha.
6. Guardar/registrar y abrir Archivo: la misma fecha debe permanecer.
7. La verificación no debe marcar la jugada como pendiente hasta `checkableFromISO` de esa fecha.
8. Cuando se comprueba, la API debe solicitar exactamente `drawDateKey` de la jugada.

## Nota de build local
En el entorno de empaquetado no está instalado el binario `vite`, por lo que la build completa debe ejecutarse en CI/Vercel tras `npm install`. La suite Node y el release guard sí se ejecutaron localmente.
