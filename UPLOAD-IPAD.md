# Publicar Primy desde un iPad con Working Copy

1. Extrae el archivo ZIP en la aplicación Archivos.
2. Abre o clona el repositorio `loom77/Sueteliquida` en Working Copy.
3. Copia el contenido extraído en la raíz del repositorio conservando las carpetas.
4. Sustituye los archivos existentes cuando se solicite.
5. Revisa que existan `src/main.jsx`, `package.json`, `api/` y `vercel.json`.
6. Crea un commit y envíalo a la rama `main`.
7. Espera a que Vercel termine el despliegue con estado `Ready`.

No subas archivos `.env` con secretos. Las variables privadas deben configurarse directamente en Vercel.
