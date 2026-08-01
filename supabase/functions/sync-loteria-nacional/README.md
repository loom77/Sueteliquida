# sync-loteria-nacional

Sincroniza el último resultado de Lotería Nacional desde la página oficial de SELAE mediante una caché de lectura, localiza el PDF del listado oficial, normaliza sus reglas a importes por décimo y actualiza `primy_draw_results`.

La función debe desplegarse con verificación JWT activa. `scheduled-sync-selae` la invoca usando la service role del proyecto.
