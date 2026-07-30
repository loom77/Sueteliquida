# Primy v15.3.1

Primy es una PWA en castellano para crear, guardar y comprobar jugadas. La aplicación no vende boletos, no predice sorteos y no garantiza premios.

## Novedades de v15.3.1

- Corrección crítica de contraste y visibilidad del generador de Euromillones.

- Euromillones operativo: creación, registro, archivo y comprobación con cinco números y dos estrellas.
- Archivo oficial de Supabase ampliado con `secondary_numbers`.
- Sincronización programada SELAE para Euromillones, La Primitiva y EuroDreams.

- Nueva página **Juegos** en `/juegos`.
- Catálogo de los diez juegos principales de SELAE, organizado por familias.
- Buscador y filtros para localizar un juego sin convertir la navegación en una lista plana.
- Arquitectura de capacidades por juego: crear, registrar, comprobar, archivo, análisis y datos oficiales.
- Solo **La Primitiva** y **EuroDreams** aparecen como operativos mientras sus reglas completas sigan siendo las únicas validadas.
- Los juegos restantes muestran su modelo de boleto y estado de preparación, pero no ofrecen acciones simuladas.

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
