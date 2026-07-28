# Primy v12.4 — cuentas y sincronización con Supabase

## Funciones implementadas

- Registro con correo y contraseña, sin Google.
- Confirmación del correo antes del primer acceso.
- Inicio y cierre de sesión.
- Reenvío del correo de confirmación.
- Recuperación y cambio de contraseña.
- Jugadas y preferencias separadas por usuario.
- Sincronización entre dispositivos.
- Copia local y cola de cambios cuando no hay conexión.
- Migración opcional de las jugadas guardadas antes de crear la cuenta.

## Seguridad

Las tablas `primy_*` tienen Row Level Security. Cada política compara `auth.uid()` con el propietario de la fila. La clave incluida en el cliente es una clave publicable; no se utiliza ninguna clave `service_role` en el navegador.

## Configuración de Auth necesaria

En Supabase → Authentication:

1. Providers → Email: mantener Email activado y **Confirm email** activado.
2. URL Configuration:
   - Site URL: `https://sueteliquida.vercel.app`
   - Redirect URLs: `https://sueteliquida.vercel.app/auth/confirm`
   - Redirect URLs: `https://sueteliquida.vercel.app/auth/recovery`
   - Para desarrollo: `http://localhost:5173/**`
3. Email Templates → Confirm signup: personalizar el texto en castellano si se desea.

El SMTP integrado de Supabase basta para pruebas y pocos amigos. Para una entrega más fiable se puede conectar posteriormente un SMTP propio.

## Plantillas de correo en castellano

El directorio `supabase/templates` contiene los modelos listos para pegar en:

- Authentication → Email Templates → Confirm signup
- Authentication → Email Templates → Reset password

Asuntos recomendados:

- `Confirma tu cuenta de Primy`
- `Restablece tu contraseña de Primy`
