# Validación final — Primy v15.8.0

## Resultado

- 137 pruebas automáticas superadas.
- 0 pruebas fallidas.
- 143 archivos JS, JSX, TS, TSX y MJS analizados sin errores sintácticos.
- 0 importaciones locales ausentes.
- ZIP de entrega validado antes de publicación.

## Cobertura del hito deportivo

- parser estricto de la composición oficial de La Quiniela;
- parser estricto de la composición oficial de El Quinigol;
- soporte para posición y partido publicados en nodos HTML separados;
- resultados numéricos y agregación `M` cuando hay tres o más goles;
- rechazo de jornadas incompletas;
- descarga oficial sin claves comerciales;
- archivo Supabase de snapshots vigentes;
- revisiones inmutables por `source_hash`;
- fallback de memoria cuando el archivo remoto no está disponible;
- escritura server-side con `service_role` sin exponer la clave;
- Edge Function de sincronización y planificación con `pg_cron`;
- endpoint público de lectura con límites y caché.

## Estado de publicación

La Quiniela y El Quinigol continúan bloqueados para creación y registro. Este hito valida la capa oficial de jornadas, no la experiencia completa de apuesta.

## Limitación del entorno

No se ejecutó la build Vite porque el registro npm disponible en el entorno no distribuye `@supabase/supabase-js@2.57.4` y el acceso al registro público agotó el tiempo de espera. No se sustituyeron dependencias ni se alteró la versión aprobada del SDK.
