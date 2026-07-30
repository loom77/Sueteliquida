# Validación final — Primy v15.0.1

## Resultado

- Pruebas automatizadas: **56 superadas, 0 fallos**.
- Sintaxis: **97 archivos JavaScript/JSX válidos**.
- Importaciones locales: **0 ausentes**.
- Referencias runtime a assets/cachés v14: **0**.
- Motor probabilístico y reglas de juego: **sin modificaciones**.

## Comprobaciones funcionales cubiertas

- Generación, reglas de La Primitiva y EuroDreams.
- Reintegro compartido y premios conocidos.
- Fechas y horarios en Europe/Madrid.
- Migración y saneamiento del historial.
- Auditoría estadística y uniformidad del motor.
- Validación de API y circuit breaker.
- Métricas mensuales, pendientes e identificadores v15.
- Confirmación de eliminación para jugadas compradas y borradores.

## Limitación del entorno

La build Vite no pudo ejecutarse en este entorno porque el registry npm interno no contiene `@supabase/supabase-js@2.57.4`; el intento con el registry público agotó el timeout. Debe ejecutarse `npm install && npm run build` en GitHub Actions, Vercel o un equipo con acceso normal a npm antes del despliegue.
