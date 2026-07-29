# Primy v14.0.1 — Correcciones finales

## Identidad visual de Michela

- Sustituidos `primy-app-icon.svg`, `primy-logo.svg`, `primy-mark.svg`, favicon e iconos PNG por los activos de **Michela Brand Core v13.4**.
- Añadidos nombres versionados (`*-v14-1.*`) en el manifiesto PWA, Apple Touch Icon, favicon y notificaciones para evitar que el navegador reutilice el icono anterior desde la caché.

## Verificación de mayoría de edad

- La creación de cuenta exige declarar que se tienen 18 años o más.
- Al acceder por primera vez, Primy solicita la fecha de nacimiento y calcula la edad exacta, incluyendo el día y el mes.
- Las personas menores de 18 años quedan bloqueadas y solo pueden cerrar sesión.
- La fecha de nacimiento se utiliza de forma transitoria y **no se almacena**. Solo se guarda la confirmación y el momento en que se realizó.
- El estado de la verificación aparece en Perfil.

Esta medida es una verificación declarativa de edad, no una comprobación documental de identidad.

## Historial y LoteriasAPI

- Eliminada la cadena de consultas de 10, 2 y 1 años que multiplicaba las solicitudes al proveedor.
- Cuando el plan no permite historial, se realiza una única consulta adicional al último sorteo.
- Caché local ampliada a 24 horas cuando solo está disponible el último sorteo.
- Protección frente a actualizaciones manuales repetidas durante 60 segundos.
- Si el proveedor limita las solicitudes, Primy conserva la última copia válida y muestra un aviso no destructivo.
- Los mensajes extensos y repetidos se sustituyen por una explicación breve y accionable.
- La interfaz aclara que el historial **no interviene en Primy Core**.

## Validación

- 50 pruebas automatizadas superadas.
- Archivos JavaScript y JSX modificados validados sintácticamente con TypeScript.
- La instalación/build completa no se pudo ejecutar en este entorno porque el registro npm interno no contiene `@supabase/supabase-js` ni `@vitejs/plugin-react`. El proyecto conserva las versiones oficiales en `package.json` para instalarse en npm/Vercel.
