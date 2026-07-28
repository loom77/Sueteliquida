# Registro de cambios

## v12.4.0 — Cuentas y Supabase

- Registro e inicio de sesión con correo y contraseña.
- Confirmación del correo, reenvío y recuperación de contraseña.
- Base de datos multiusuario con tablas `primy_*`.
- Row Level Security para aislar completamente los datos de cada cuenta.
- Sincronización de jugadas y preferencias entre dispositivos.
- Importación opcional del historial antiguo del navegador.
- Cola local de cambios para periodos sin conexión.
- Sección de cuenta y cierre de sesión.

## v12.3.0 — Localización es-ES

- Interfaz, accesibilidad, mensajes, rutas y documentación convertidos a castellano.
- Rutas principales: `/generar`, `/jugadas` y `/ajustes`.

## v12.2.0 — Reglas SELAE

- Un único Reintegro por resguardo de La Primitiva.
- Un número Sueño por apuesta simple de EuroDreams.
- Límites de ocho apuestas para La Primitiva y seis para EuroDreams.
- Verificación de premios y migración del historial ajustadas al modelo correcto.

## v12.1.0 — Yuma Focused UX

- La página de inicio permite elegir el juego explícitamente.
- Flujo simplificado: juego → presupuesto → generación → registro.
- Detalles técnicos ocultos inicialmente.
- Mejor navegación y enfoque del resultado en móvil.

## v12.0.0 — Refuerzo técnico

- Validación de API, observabilidad, cortacircuitos y barrera global de errores.
- Endpoints serverless endurecidos y pruebas automáticas ampliadas.

## 12.5.0 — Iker Visual Restyle

- Nueva identidad visual verde, crema y dorada inspirada en el lenguaje gráfico de la lotería española sin reproducir marcas oficiales.
- Nueva marca Primy, favicon e iconos PWA.
- Tipografía Sora para títulos y números e Inter para la interfaz.
- Rediseño de acceso, navegación, dashboard, generador, boleto y estados de jugadas.
- Nuevas ilustraciones SVG y microinteracciones respetando `prefers-reduced-motion`.
- Manifest PWA actualizado a español y nueva paleta de instalación.
