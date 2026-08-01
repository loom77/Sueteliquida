# Validación final — Primy v16.2.0

## Alcance

- iconografía gráfica diferenciada para ocho juegos;
- transición de rutas y cascada de componentes;
- perfil con nombre editable y persistencia Supabase;
- saludo personalizado sin usar el correo como nombre;
- centro legal, privacidad y juego responsable;
- sello de release visible.

## Privacidad: corrección necesaria

Primy conserva las jugadas que el usuario decide guardar en `primy_plays` para ofrecer archivo y sincronización. Por ello la aplicación no afirma falsamente que nunca se guarda ningún dato de jugada. Los textos explican el tratamiento real y deberán someterse a revisión jurídica profesional antes de explotación comercial.

## Verificación

- 157 pruebas automáticas superadas, 0 fallos;
- activos PNG presentes y válidos;
- ZIP verificado;
- build Vite no ejecutada: `vite: not found` porque las dependencias no están instaladas en este entorno; no se han sustituido versiones.
