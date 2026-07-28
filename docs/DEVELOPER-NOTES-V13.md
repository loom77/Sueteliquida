# Primy v13 — Developer Notes

## Arquitectura de producto

La interfaz se organiza en cinco áreas principales: Inicio, Crear, Explorar, Archivo y Perfil. El flujo de creación está encapsulado en `CreateJourney`, que coordina configuración, ejecución de Primy Core y presentación del resultado.

## Motor

El generador de producción utiliza selección uniforme sin reemplazo y no consume análisis históricos ni modelos predictivos. La versión declarada del motor es `13.0-david-uniform`.

Los módulos históricos y experimentales permanecen separados para análisis y pruebas. No deben conectarse al flujo de generación de producción sin una revisión matemática explícita.

## Compatibilidad

- Las rutas v13 son `/crear`, `/explorar`, `/archivo` y `/ajustes`.
- Se conserva compatibilidad con `/generar` y `/jugadas`.
- Los callbacks de autenticación siguen usando `/auth/confirm` y `/auth/recovery`.
- El esquema de caché local y las cachés PWA están versionados como v13.

## Seguridad y PWA

- CSP y rewrites se mantienen en `vercel.json`.
- La página offline no utiliza JavaScript inline.
- Los cambios locales pendientes pueden reintentarse desde Perfil.

## Validación ejecutada

- `npm test`: 41/41.
- Importaciones locales inexistentes: 0.
- JSON de Vercel válido.
- Handlers inline en assets públicos: 0.

## Gate pendiente

La instalación de dependencias no pudo completarse en el entorno de trabajo porque el registry npm no respondió dentro del límite disponible. Antes de publicar deben ejecutarse:

1. `npm ci` o `npm install`.
2. `npm run build`.
3. Pruebas de navegador sobre `dist`.
4. Revisión responsive final en dispositivos reales o emulados.
