# Registro de cambios

## v12.6.1 — Corrección del generador responsive

- Corregida la superposición y compresión del tutorial al mostrar un boleto generado.
- El generador y el boleto solo se muestran en dos columnas cuando existe anchura real suficiente.
- En vista compacta, la mascota se convierte en un banner horizontal y deja de robar ancho a los controles.
- Añadidas protecciones `min-width: 0` para evitar desbordamientos y texto en columnas verticales.
- El resultado se desplaza debajo del generador en portátiles y pantallas medianas.

## v12.6.0 — Pulido visual, movimiento y sistema de mascota

- Nueva paleta Primy más luminosa y equilibrada: verde principal, mint, ivory, cream, gold, sky, peach y lavender.
- Sistema de mascota con variantes Welcome, Helper, Thinking, Celebration, Empty y Responsible.
- Mascota contextual integrada en autenticación, dashboard, onboarding, generador, estados vacíos, guardado, migración, ajustes y errores.
- Nuevo diseño de acceso y registro más compacto, sin espacio blanco interior innecesario y con pestañas dedicadas.
- Animaciones accesibles para entrada de página, tarjetas, mascota, shimmer, revelado de bolas y feedback de éxito.
- Generador rediseñado con la mascota Thinking durante el procesamiento.
- Estados de vista previa y guardado del boleto enriquecidos con las mascotas Helper y Celebration.
- Manifest PWA y cachés actualizados a la versión v12.6.

## v12.5.4 — Auth layout tightened and rebalanced

- Reducción fuerte del ancho útil del bloque de autenticación para eliminar el espacio blanco excesivo en desktop.
- Columnas de acceso con anchuras controladas y centradas, evitando la sensación de pantalla vacía.
- Mascota, titular y formulario mejor proporcionados entre sí.
- Ajuste de padding vertical para acercar el contenido a la parte alta del viewport.

## v12.5.3 — Reequilibrio visual de acceso y home

- Rediseño completo de login y registro para eliminar espacios vacíos excesivos y mejorar el equilibrio entre hero, mascota y formulario.
- Formulario de acceso desplazado hacia arriba y encapsulado en una tarjeta más clara y compacta.
- Reordenación de textos, jerarquía y bloques informativos en la pantalla de autenticación.
- Ajuste de la página principal/dashboard para reducir altura muerta, compactar la hero y mejorar la distribución de CTAs y contenido.

## v12.5.2 — Mascota extendida en la experiencia

- La mascota de Primy ahora aparece también en el estado vacío de Mis jugadas.
- Integración en la introducción paso a paso para reforzar onboarding y personalidad.
- Integración en la migración de datos locales a la cuenta.
- Nuevo bloque “Consejo de Primy” en Ajustes para reforzar el juego responsable.

## v12.5.1 — Mascota Primy

- Integración de la nueva mascota búho de Primy en las áreas hero.
- Sustitución de la ilustración genérica anterior por una identidad más divertida y memorable.
- Nuevos assets optimizados `primy-mascot.webp` y `primy-mascot-card.webp`.
- La pantalla de acceso y el dashboard usan ahora la mascota como elemento principal de marca.

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
