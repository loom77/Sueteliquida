# Primy v13 — QA Report

## Resultado actual

Estado: **Release Candidate condicionada**.

La lógica de dominio, el motor uniforme, las rutas, los assets PWA y los principales flujos han sido revisados. La aprobación final queda condicionada a la build de producción y a la validación en navegador.

## Pruebas automáticas

- Total: 41
- Superadas: 41
- Fallidas: 0

Áreas cubiertas:

- reglas de La Primitiva y EuroDreams;
- reintegro y Sueño;
- horarios Europe/Madrid;
- generación uniforme y reproducibilidad por semilla;
- ausencia de filtros sobre secuencias y números bajos;
- independencia respecto al historial;
- migraciones y validación de premios;
- API, validadores, circuit breaker e historial.

## Revisiones estáticas

- Importaciones locales ausentes: 0.
- TODO/FIXME/HACK en código de producto: 0.
- `confirm`, `alert` o `prompt` nativos de producto: 0, salvo `event.prompt()` de instalación PWA.
- Event handlers inline en `public` e `index.html`: 0.
- `vercel.json`: JSON válido.

## Dogfooding

Perfiles revisados:

- usuario nuevo;
- usuario habitual;
- usuario que comprueba resultados;
- usuario que accede mediante deep link.

Correcciones principales:

- CTA coherentes;
- acceso directo desde Archivo vacío;
- cancelación del worker al abandonar Crear;
- confirmación accesible de eliminación;
- separación entre creación y análisis histórico;
- sincronización pendiente visible y reintentable.

## Gate no ejecutado

- Build Vite de producción.
- Ejecución en navegador de la carpeta `dist`.
- Métricas Web Vitals sobre build final.
- Revisión visual real en móvil, tablet y escritorio.
