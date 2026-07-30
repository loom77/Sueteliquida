# Validación final — Primy v15.3.0

## Alcance

- Euromillones activado en el catálogo y el selector de juegos.
- Generación uniforme e independiente de 5 números y 2 estrellas por columna.
- Registro manual, persistencia, repetición, archivo y comprobación de resultados.
- Trece categorías de premio de Euromillones, sin inventar importes cuando SELAE no publica una cuantía utilizable.
- Migración Supabase con `secondary_numbers` y validación específica por juego.
- Sincronización SELAE ampliada con una función dedicada para Euromillones y ejecución programada conjunta.
- Interfaz adaptable por juego para números principales, estrellas, estados y colores semánticos.

## Controles completados

- 69 pruebas automatizadas superadas; 0 fallos.
- 106 archivos JavaScript, JSX y TypeScript comprobados sintácticamente; 0 errores.
- 106 archivos de código inspeccionados para importaciones locales; 0 importaciones ausentes.
- Búsqueda de secretos: no se incluyen claves reales `service_role` ni secretos de sincronización en el paquete.
- Integridad del archivo ZIP comprobada con `unzip -t`.
- Checksum SHA-256 generado junto al paquete.

## Backend aplicado

- La migración de Euromillones fue aplicada en el proyecto Supabase conectado.
- Las funciones de sincronización fueron desplegadas y probadas.
- La ejecución conjunta guardó correctamente La Primitiva, EuroDreams y Euromillones.
- El último resultado de Euromillones quedó almacenado con números, estrellas y tabla de premios.

## Límite del entorno

La build Vite requiere instalar las dependencias npm. El registro interno del entorno de trabajo no contiene `@supabase/supabase-js@2.57.4` y el intento contra el registro público agotó el tiempo disponible. Por ello, la build final debe ejecutarse en Vercel, GitHub Actions o un equipo con acceso normal al registro npm.
