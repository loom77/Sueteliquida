# Primy v15

Primy es una PWA en castellano para crear, guardar y comprobar jugadas de **La Primitiva** y **EuroDreams**. La aplicación no vende boletos, no predice sorteos y no garantiza premios.

## Novedades de v15

- Eliminación segura de cualquier jugada desde el archivo, con confirmación específica para boletos registrados como comprados.

- Arquitectura modular con controlador de aplicación, vistas lazy y overlays separados.
- Generación cancelable y protegida con timeout mediante Web Worker.
- Recuperación aislada de errores por pantalla.
- Inicio más claro con una acción principal, resumen mensual y últimas jugadas.
- Perfil y ajustes reorganizados con backup v15 y límite mensual personal.
- Mejoras de accesibilidad: foco tras la navegación, estados anunciados y targets táctiles.
- PWA actualizada con cachés v15 y accesos directos a Crear y Archivo.
- Laboratorio Monte Carlo explicativo, cancelable y sin afirmaciones predictivas.

## Arquitectura

```text
React + Vite + PWA
        │
        ├── Vercel Functions → LoteriasAPI
        │
        └── Supabase
             ├── Auth por correo
             ├── PostgreSQL
             └── RLS por usuario
```

La lógica de interfaz se organiza en:

```text
src/App.jsx                  entry point autenticado
src/hooks/useAppController   orquestación de la aplicación
src/hooks/useGenerationController
src/hooks/usePlayActions
src/hooks/useResultChecking
src/app/AppViews             carga y aislamiento de vistas
src/app/AppOverlays          diálogos y feedback global
```

## Configuración

Variables utilizadas en Vercel:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
LOTERIA_API_KEY
```

La clave publicable de Supabase puede estar en el cliente; la seguridad depende de las políticas RLS. Nunca debe exponerse una clave `service_role`.

## Desarrollo

```bash
npm install
npm run dev
npm test
npm run build
```

Requiere Node.js 20–24.

## Reglas implementadas

- **La Primitiva:** de 1 a 8 apuestas simples por boleto, seis números por columna y un único reintegro por resguardo.
- **EuroDreams:** de 1 a 6 apuestas simples por boleto, seis números y un número Sueño por apuesta.
- El historial y el laboratorio estadístico son informativos y no modifican la generación uniforme de la próxima jugada.

## Función scanner

El scanner de boletos permanece en la hoja de ruta. No se incluye una simulación basada únicamente en una fotografía: se implementará cuando exista reconocimiento real, validación de campos y uso explícito de la cámara posterior.
