# Validación final — Primy v15.4.0

## Bonoloto

- Generación sencilla: aprobada.
- Mínimo de dos apuestas y máximo de ocho: aprobado.
- Múltiples 5 y 7–11: aprobadas.
- Equivalencias 44/7/28/84/210/462: aprobadas.
- Persistencia compacta de múltiples: aprobada.
- Reintegro solicitado al registrar y no generado: aprobado.
- Comprobación de categorías y premios agregados: aprobada.
- Parser SELAE Bonoloto: aprobado.
- Archivo Supabase y migración: incluidos.
- CTA y selector con contraste protegido: aprobados por prueba de regresión.

## Experiencia Primy Core

- Cabecera translúcida con animación ambiental: aprobada.
- CTA «Descubre más sobre Primy Core»: visible, táctil y accesible.
- Diálogo con foco atrapado, cierre por Escape y devolución de foco: aprobado mediante `AccessibleDialog`.
- Copy simple sobre reglas, generación independiente y validación: aprobado.
- Mensaje responsable «no compra, no predice, no garantiza»: aprobado.
- Mascota helper reutilizada sin incorporar activos externos: aprobada.
- Respeto de `prefers-reduced-motion`: aprobado por prueba de regresión.

## Regresión

- Suite Node: 84 pruebas superadas, 0 fallos.
- Análisis sintáctico JS/JSX/TS: sin errores.
- Importaciones locales: sin referencias ausentes.
- La Primitiva, Euromillones y EuroDreams mantienen sus flujos.

## Limitación del entorno

La build Vite completa requiere descargar las dependencias npm. En este entorno el acceso al registry puede expirar; la sintaxis JSX/TS se valida con el parser TypeScript y la build definitiva debe ejecutarse en Vercel o en local con acceso normal a npm.
