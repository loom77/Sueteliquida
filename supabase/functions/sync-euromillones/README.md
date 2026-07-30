# sync-euromillones

Sincronizador de respaldo para Euromillones. Se mantiene separado porque la presentación del bloque oficial puede variar respecto a los demás juegos.

La función se despliega con `verify_jwt=true` y solo es invocada por `scheduled-sync-selae` usando el JWT de servicio de Supabase.
