# sync-sports-rounds

Sincroniza la composición vigente de La Quiniela y El Quinigol desde las páginas oficiales de comprobación de SELAE.

- No usa una API comercial ni claves de terceros.
- Conserva el snapshot actual en `primy_sports_rounds`.
- Registra cada cambio de composición en `primy_sports_round_revisions`.
- No activa todavía la creación de boletos deportivos en la aplicación.
