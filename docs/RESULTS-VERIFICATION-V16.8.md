# Primy v16.8 — Comprobación inmediata de resultados

## Experiencia
- Botón `Comprobar ahora` en cada jugada comprada y pendiente.
- Estado de carga específico por jugada.
- Comprobación automática al abrir o recuperar la aplicación.
- Reintento silencioso cada dos minutos mientras existan jugadas pendientes y la app esté visible.

## Datos
- `check-results` no almacena respuestas negativas en caché.
- Si el archivo Primy aún no tiene el sorteo, el servidor consulta el resultado oficial del juego en tiempo real.
- El resultado validado se guarda en el archivo compartido para acelerar las comprobaciones posteriores.
- El cron de resultados usa una ventana rápida de cinco minutos y fallbacks posteriores.

## Alcance
La comprobación inmediata está activa para La Primitiva, Bonoloto, Euromillones, El Gordo de la Primitiva, EuroDreams y Lotería Nacional. Los módulos deportivos e hípicos seguirán su flujo específico hasta disponer de escrutinio operativo.
