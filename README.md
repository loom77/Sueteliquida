# Primy v15.4.0

Primy es una PWA en castellano para crear, guardar y comprobar jugadas. La aplicación no vende boletos, no predice sorteos y no garantiza premios.

## Novedades de v15.4.0

- Bonoloto operativa en generación sencilla y múltiple, registro, archivo y comprobación.
- Apuestas sencillas de 2 a 8 columnas y múltiples oficiales de 5 o 7–11 números.
- Desarrollo exacto de 44, 7, 28, 84, 210 o 462 apuestas equivalentes sin guardar cientos de columnas duplicadas.
- El reintegro no se inventa: se solicita al registrar el resguardo comprado.
- Cálculo de coste por apuestas equivalentes y verificación de 6, 5+C, 5, 4, 3 y reintegro.
- Sincronización oficial SELAE y archivo Supabase ampliados para Bonoloto.
- CTA con contraste protegido, flujo responsive y métricas basadas en apuestas reales.
- Euromillones, La Primitiva y EuroDreams continúan operativos.
- Primy Core gana una presentación translúcida animada y un diálogo educativo accesible con la mascota Primy.

## Catálogo

```text
Juegos
├── Loterías de números
│   ├── Euromillones
│   ├── La Primitiva
│   ├── Bonoloto
│   ├── El Gordo de la Primitiva
│   └── EuroDreams
├── Lotería Nacional
├── Apuestas deportivas
│   ├── La Quiniela
│   └── El Quinigol
└── Apuestas hípicas
    ├── Lototurf
    └── Quíntuple Plus
```

Cada juego pasa por un gate conjunto de producto/UX, arquitectura, reglas y diseño antes de activar sus funciones.

## Resultados oficiales

SELAE es la fuente oficial. Supabase sincroniza y conserva los resultados verificados en `primy_draw_results`; las sesiones de usuario leen ese archivo y no multiplican las consultas externas.

```text
Página oficial SELAE
        │
        ▼
Supabase Cron → Edge Functions → validación estricta
                                  │
                                  ▼
                         primy_draw_results
                                  │
                                  ▼
                         API de lectura Primy
```

## Configuración de Vercel

Variables públicas requeridas:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Opcionales para las API de lectura:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
RESULT_CACHE_TTL_MINUTES
```

No se necesitan `LOTERIA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ni `CRON_SECRET` en Vercel.

## Desarrollo

```bash
npm install
npm run dev
npm test
npm run build
```

Requiere Node.js 20–24.

## Juegos operativos actualmente

- **La Primitiva:** de 1 a 8 apuestas simples por boleto, seis números por columna y un único reintegro por resguardo.
- **EuroDreams:** de 1 a 6 apuestas simples por boleto, seis números y un número Sueño por apuesta.

El historial y el laboratorio estadístico son informativos y no modifican la generación uniforme de la próxima jugada.

## Función scanner

El scanner de boletos permanece en la hoja de ruta. Se implementará cuando exista reconocimiento real, validación de campos y uso explícito de la cámara posterior.
