# Validación final — Primy v15.1.0

## Resultado

- 59 pruebas automatizadas superadas.
- 102 archivos JavaScript, JSX y MJS analizados sintácticamente con TypeScript.
- 0 importaciones locales ausentes.
- 2 archivos JSON validados.
- 0 referencias de ejecución a `LOTERIA_API_KEY`, `api.loteriasapi.com` o `_loteriasApi.js`.
- No se ha incluido ninguna clave `service_role` real.

## Cobertura específica de la migración

- interpretación de La Primitiva y EuroDreams;
- validación de seis números, Complementario, Reintegro y Sueño;
- rechazo de fechas distintas a la solicitada;
- soporte de datos visibles, bolas HTML y datos estructurados embebidos;
- consultas sin cabecera `x-api-key`;
- archivo temporal cuando Supabase server-side no está configurado;
- persistencia con `service_role` mediante REST;
- recuperación y archivo de fechas recientes;
- calendario oficial de días de sorteo.

## Gate de despliegue

La build Vite no se ha ejecutado en este entorno porque las dependencias no están instaladas (`vite: not found`). Antes de publicar:

```bash
npm install
npm run build
```

Después del despliegue debe realizarse una verificación real de `/api/provider-status`, porque el entorno de trabajo no dispone de acceso directo a internet hacia SELAE.
