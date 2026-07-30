# sync-selae

Sincroniza Euromillones, La Primitiva y EuroDreams desde la página oficial de resultados de SELAE hacia `public.primy_draw_results`.

La función requiere el secreto de proyecto `PRIMY_SYNC_SECRET`. La función programada debe enviar el mismo valor mediante la cabecera `x-primy-sync-secret`. Las claves de servicio nunca deben incorporarse al cliente web.
