# Primy v12.4.1 — corrección Supabase/Vercel

## Correcciones incluidas

- Permite las conexiones HTTPS y WebSocket al proyecto Supabase desde la política CSP.
- Mantiene las rutas en castellano: `/generar`, `/jugadas` y `/ajustes`.
- Añade las rutas de autenticación `/auth/confirm` y `/auth/recovery`.
- Corrige el idioma del documento HTML a `es-ES`.
- Elimina la carpeta local `.vercel` del paquete destinado a GitHub.
- Conserva la autenticación multiusuario, la confirmación por correo y la sincronización privada.

## Variables requeridas en Vercel

- `LOTERIA_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Después de cambiar variables de entorno, debe existir un despliegue nuevo para que Vite las incorpore al bundle.
