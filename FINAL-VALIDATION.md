# Primy v14.0.1 — Final validation

## Estado

Paquete corregido con los tres puntos revisados:

1. iconografía de Michela Brand Core aplicada y versionada;
2. verificación obligatoria de mayoría de edad;
3. estabilización del historial y reducción de errores de LoteriasAPI.

## Pruebas

- `npm test`: **50/50 superadas**.
- Validación sintáctica JS/JSX mediante TypeScript: superada.
- Integridad de importaciones locales: superada.
- Integridad del ZIP: superada.

## Límite del entorno de validación

No fue posible ejecutar `npm install` ni `npm run build` porque el registro npm interno del entorno no dispone de `@supabase/supabase-js@2.57.4` ni `@vitejs/plugin-react@4.3.1`. No se cambiaron estas dependencias por sustitutos no oficiales.

En un entorno npm estándar:

```bash
npm install
npm test
npm run build
```

## Nota sobre el icono instalado

Los activos usan nombres nuevos para invalidar la caché. En iOS/iPadOS, una instalación antigua en la pantalla de inicio puede requerir eliminar el acceso anterior y volver a añadir Primy después del despliegue.
