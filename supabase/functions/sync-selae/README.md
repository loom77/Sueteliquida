# sync-selae

Sincroniza La Primitiva, Bonoloto, Euromillones y EuroDreams desde la página oficial SELAE mediante una caché de lectura, valida los resultados y los guarda en `primy_draw_results`.

La función se despliega con `verify_jwt=true`. `scheduled-sync-selae` la invoca con el JWT `SUPABASE_SERVICE_ROLE_KEY` proporcionado automáticamente por Supabase.
