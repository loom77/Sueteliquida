# Validación lingüística y técnica — Primy v12.3 (es-ES)

## Alcance de la conversión

- Interfaz React completa.
- Navegación, rutas, botones, estados vacíos, avisos y mensajes de error.
- Etiquetas de accesibilidad, lector de pantalla y notificaciones.
- Respuestas y errores de las funciones API.
- Metadatos HTML, manifiesto de la aplicación web progresiva y página sin conexión.
- Pruebas automáticas y mensajes de integración continua.
- README, registro de cambios, auditorías, validaciones y documentación de Alvaro y Yuma.

## Convenciones aplicadas

- Variante lingüística: español de España (`es-ES`).
- Formato monetario: euro con configuración regional `es-ES`.
- Zona horaria: `Europe/Madrid`.
- Terminología SELAE: boleto, resguardo, apuesta simple, Reintegro, Complementario, Sueño y bote.
- Rutas públicas: `/generar`, `/jugadas` y `/ajustes`.

## Comprobaciones realizadas

- **38 de 38 pruebas automáticas superadas.**
- **64 archivos JavaScript/JSX analizados sin errores sintácticos.**
- Archivos JSON de proyecto y Vercel validados.
- Importaciones relativas comprobadas sin rutas ausentes.
- Búsqueda de cadenas residuales en italiano completada sin coincidencias lingüísticas pendientes.
- La URL del proveedor se conserva corregida como `https://api.loteriasapi.com/api/v1`.

## Compilación

La instalación de dependencias no terminó dentro del límite del entorno de trabajo, por lo que no se generó aquí la carpeta `dist`. El proyecto mantiene los scripts originales para ejecutar:

```bash
npm install
npm test
npm run build
```

Vercel debe ejecutar la compilación al publicar el contenido del paquete en el repositorio vinculado.
