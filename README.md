# Primy v12.4 — cuentas y sincronización con Supabase

Primy es una PWA en castellano para crear y gestionar jugadas de **La Primitiva** y **EuroDreams**. La versión 12.4 añade cuentas multiusuario con correo y contraseña, confirmación del correo y sincronización privada entre dispositivos.

## Funciones principales

- Registro e inicio de sesión sin Google.
- Confirmación del correo antes del primer acceso.
- Recuperación y cambio de contraseña.
- Historial privado por usuario, protegido con Row Level Security.
- Sincronización de jugadas, borradores y preferencias.
- Importación opcional de las jugadas antiguas guardadas en el navegador.
- Funcionamiento temporal sin conexión con sincronización posterior.
- Generación coordinada para La Primitiva y EuroDreams.
- Consulta de resultados mediante funciones serverless de Vercel.

## Arquitectura

```text
React + Vite + PWA
        │
        ├── Vercel Functions → LoteriasAPI
        │
        └── Supabase
             ├── Auth: correo + contraseña
             ├── PostgreSQL
             └── RLS por usuario
```

## Tablas Supabase

- `primy_profiles`
- `primy_plays`
- `primy_user_settings`
- `primy_data_migrations`

Las tablas usan el prefijo `primy_` para no interferir con otros proyectos del mismo Supabase. El rol anónimo no tiene acceso y cada usuario autenticado solo puede leer o modificar sus propias filas.

## Configuración de autenticación

En Supabase debe estar activada la confirmación de correo. Configura:

```text
Site URL
https://sueteliquida.vercel.app

Redirect URLs
https://sueteliquida.vercel.app/auth/confirm
https://sueteliquida.vercel.app/auth/recovery
http://localhost:5173/**
```

## Variables opcionales de Vercel

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
LOTERIA_API_KEY
```

La clave publicable de Supabase puede estar en el cliente; la seguridad depende de RLS. Nunca debe exponerse una clave `service_role`.

## Desarrollo

```bash
npm install
npm run dev
npm test
npm run build
```

## Reglas de juego implementadas

- **La Primitiva:** de 1 a 8 apuestas simples por boleto; seis números por columna y un único Reintegro para todo el resguardo.
- **EuroDreams:** de 1 a 6 apuestas simples por boleto; seis números y un número Sueño por apuesta.
- Primy no compra boletos y no promete resultados. El usuario debe realizar la compra en un canal autorizado.
